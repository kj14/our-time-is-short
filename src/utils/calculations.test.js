import { describe, it, expect } from 'vitest';
import { calculateAge, calculateTimeWithPerson, getLifeExpectancy } from './calculations';

describe('calculateAge', () => {
    it('returns null for null/undefined', () => {
        expect(calculateAge(null)).toBeNull();
        expect(calculateAge(undefined)).toBeNull();
    });

    it('returns null when birth fields are missing', () => {
        expect(calculateAge({})).toBeNull();
        expect(calculateAge({ birthYear: 1990 })).toBeNull();
    });

    it('uses explicit age when given', () => {
        expect(calculateAge({ age: 30 })).toBe(30);
        expect(calculateAge({ age: 0 })).toBe(0);
    });

    it('computes age from birthYear/Month/Day', () => {
        const today = new Date();
        const age = calculateAge({
            birthYear: today.getFullYear() - 25,
            birthMonth: 1,
            birthDay: 1
        });
        // Should be roughly 25 — fractional within [24.95, 26].
        expect(age).toBeGreaterThanOrEqual(24);
        expect(age).toBeLessThan(26);
    });

    it('accepts Date and ISO string', () => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 40);
        expect(calculateAge(d)).toBeGreaterThanOrEqual(39);
        expect(calculateAge(d.toISOString())).toBeGreaterThanOrEqual(39);
    });
});

describe('getLifeExpectancy', () => {
    it('returns life basis by default', () => {
        expect(getLifeExpectancy('Japan')).toBeCloseTo(84.6, 1);
    });

    it('returns healthy basis when requested', () => {
        const life = getLifeExpectancy('Japan', 'life');
        const healthy = getLifeExpectancy('Japan', 'healthy');
        expect(healthy).toBeLessThan(life);
    });

    it('falls back to Global for unknown countries', () => {
        expect(getLifeExpectancy('Atlantis')).toBeCloseTo(73.2, 1);
    });
});

describe('calculateTimeWithPerson', () => {
    it('returns zeros when person has no age data', () => {
        const r = calculateTimeWithPerson({
            person: { name: 'X' },
            userAge: 30,
            country: 'Japan',
            remainingYears: 50
        });
        expect(r.hours).toBe(0);
        expect(r.meetings).toBe(0);
    });

    it('clamps to remainingYears even if person can live longer', () => {
        const r = calculateTimeWithPerson({
            person: { age: 5, meetingFrequency: 365, hoursPerMeeting: 1 },
            userAge: 80,
            country: 'Japan',
            remainingYears: 4 // user only has 4 years left
        });
        expect(r.years).toBe(4);
    });

    it('young person bounded by user life expectancy', () => {
        // 30-year-old user, 5-year-old child, Japan (lifeExpectancy 84.6)
        // child bounded by user's life: 84.6 - 5 = 79.6, but min(79.6, userRemainingYears=54.6) = 54.6
        const r = calculateTimeWithPerson({
            person: { age: 5, meetingFrequency: 1, hoursPerMeeting: 1 },
            userAge: 30,
            country: 'Japan',
            remainingYears: 54.6
        });
        expect(r.years).toBeCloseTo(54.6, 1);
    });

    it('older person bounded by their own life expectancy', () => {
        // 30-year-old user, 70-year-old parent
        // parent bounded by parent's life: 84.6 - 70 = 14.6
        const r = calculateTimeWithPerson({
            person: { age: 70, meetingFrequency: 12, hoursPerMeeting: 6 },
            userAge: 30,
            country: 'Japan',
            remainingYears: 54.6
        });
        expect(r.years).toBeCloseTo(14.6, 1);
        expect(r.meetings).toBeCloseTo(14.6 * 12, 0);
        expect(r.hours).toBeCloseTo(14.6 * 12 * 6, 0);
    });
});
