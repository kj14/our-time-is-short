// Shared domain types. Imported by both .ts and .jsx (via JSDoc) modules.

export type Relationship =
    | 'parent'
    | 'child'
    | 'sibling'
    | 'spouse'
    | 'partner'
    | 'friend'
    | 'mentor'
    | 'other';

export type CalculationBasis = 'life' | 'healthy' | 'working';

export type Language = 'ja' | 'en';

// A "person" placed in the user's universe.
export interface Person {
    id: string;
    name: string;
    relationship?: Relationship;
    isMentor?: boolean;

    // Either explicit age OR birth Y/M/D may be present.
    age?: number;
    birthYear?: number;
    birthMonth?: number; // 1-12
    birthDay?: number;

    meetingFrequency: number; // events per year
    hoursPerMeeting: number;
    textureUrl?: string;
    color?: string; // legacy accent colour used by PeopleSettings list / DetailPage
}

export interface UserData {
    country: string;
    age: number;
    lifeExpectancy?: number;
    healthyLifeExpectancy?: number;
    workingAgeLimit?: number;
}

export interface CountryRow {
    key: string;
    nameJa: string;
    nameEn: string;
    lifeExpectancy: number;
    healthyLifeExpectancy: number;
    workingAgeLimit: number;
    lat: number;
    lng: number;
}

// Truth Messages
export type TemplateRequirement = Relationship | 'anyPerson' | 'self';

export interface TruthTemplate {
    id: string;
    requires: TemplateRequirement[];
    compute: (ctx: TruthContext) => {
        q: { ja: string; en: string };
        a: { ja: string; en: string };
    };
}

export interface TruthContext {
    userAge: number;
    userCountry: string;
    basis: CalculationBasis;
    people: Person[];
    peopleByRelationship: Record<Relationship, Person[]>;
    userLifeExpectancy: number;
    userRemainingYears: number;
    userLifePercentLived: number;
}

export interface TruthMessageOutput {
    id: string;
    question: { ja: string; en: string };
    answer: { ja: string; en: string };
}

// View modes (used by Phase 4.5 useReducer migration when it lands).
export type ViewMode =
    | 'OVERVIEW'
    | 'EARTH_ZOOM'
    | 'PERSON_FOCUS'
    | 'DETAIL_PAGE'
    | 'SETTINGS'
    | 'ADDING_PERSON';
