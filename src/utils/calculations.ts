// Single source of truth for age and time-with-person calculations.
// Previously these were duplicated across 5+ components with subtly
// different algorithms (asymmetric vs symmetric life-expectancy clamping),
// which produced different "hours together" numbers in different views
// for the same person.

import {
    lifeExpectancyData,
    healthyLifeExpectancyData,
    workingAgeLimitData
} from './lifeData';
import type { CalculationBasis, Person } from '../types';

type AgeInput =
    | null
    | undefined
    | Date
    | string
    | { age?: number | string | null; birthYear?: number; birthMonth?: number; birthDay?: number };

// Returns fractional years for accurate downstream math.
// Accepts:
//   - { age: number }                          (explicit age)
//   - { birthYear, birthMonth, birthDay }      (1-indexed month, as used by InputSection / PersonSettings)
//   - Date | string (ISO)                      (raw birthdate)
export function calculateAge(input: AgeInput): number | null {
    if (input == null) return null;

    if (input instanceof Date) {
        return ageFromDate(input);
    }
    if (typeof input === 'string') {
        const d = new Date(input);
        return Number.isNaN(d.getTime()) ? null : ageFromDate(d);
    }
    if (typeof input === 'object') {
        if (input.age !== undefined && input.age !== null && input.age !== '') {
            return Number(input.age);
        }
        if (input.birthYear && input.birthMonth && input.birthDay) {
            const d = new Date(input.birthYear, input.birthMonth - 1, input.birthDay);
            return ageFromDate(d);
        }
    }
    return null;
}

function ageFromDate(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
    }
    const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    const lastBirthday = new Date(nextBirthday);
    lastBirthday.setFullYear(nextBirthday.getFullYear() - 1);
    const yearProgress =
        (today.getTime() - lastBirthday.getTime()) /
        (nextBirthday.getTime() - lastBirthday.getTime());
    return age + yearProgress;
}

// Resolves life expectancy for a country under the given calculation basis.
export function getLifeExpectancy(country: string, basis: CalculationBasis = 'life'): number {
    const dict =
        basis === 'healthy' ? healthyLifeExpectancyData :
        basis === 'working' ? workingAgeLimitData :
        lifeExpectancyData;
    return dict[country] ?? dict.Global;
}

export interface TimeWithPersonResult {
    hours: number;
    meetings: number;
    days: number;
    years: number;
    personAge: number | null;
}

// Canonical time-with-person calculation (from Visualization.jsx).
// The relationship is bounded by whichever life ends first:
//   - person younger than user → bounded by user's life expectancy
//   - person older or same age → bounded by person's life expectancy
// (Both currently use the same country's life expectancy as a unisex average.)
export function calculateTimeWithPerson(args: {
    person: Person | (Partial<Person> & { name?: string });
    userAge: number;
    country: string;
    basis?: CalculationBasis;
    remainingYears?: number;
}): TimeWithPersonResult {
    const { person, userAge, country, basis = 'life', remainingYears } = args;
    const personAge = calculateAge(person as AgeInput);
    if (personAge === null) {
        return { hours: 0, meetings: 0, days: 0, years: 0, personAge: null };
    }

    const userLE = getLifeExpectancy(country, basis);
    const personLE = userLE; // same-country average; refine later if we add per-person country
    const limitLE = personAge < userAge ? userLE : personLE;

    const yearsWithPerson = Math.max(0, limitLE - personAge);
    const effectiveRemaining = remainingYears ?? Math.max(0, userLE - userAge);
    const effectiveYears = Math.min(yearsWithPerson, effectiveRemaining);

    const meetings = effectiveYears * (person.meetingFrequency || 0);
    const hours = meetings * (person.hoursPerMeeting || 0);

    return {
        hours: Math.max(0, hours),
        meetings: Math.max(0, meetings),
        days: Math.max(0, hours / 24),
        years: effectiveYears,
        personAge
    };
}

// Convenience: just hours (back-compat with old calculateHoursWithPerson signature).
export function calculateHoursWithPerson(
    person: Person,
    userAge: number,
    userCountry: string,
    remainingYears?: number,
    basis: CalculationBasis = 'life'
): number {
    return calculateTimeWithPerson({
        person,
        userAge,
        country: userCountry,
        basis,
        remainingYears
    }).hours;
}
