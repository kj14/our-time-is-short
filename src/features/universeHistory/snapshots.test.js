import { describe, it, expect, beforeEach } from 'vitest';
import {
    loadSnapshots,
    maybeTakeSnapshot,
    findComparisonSnapshot,
    diffUniverse,
    hasAnyChange
} from './snapshots';

const DAY = 24 * 60 * 60 * 1000;

const person = (id, name, freq = 12, hours = 2, extra = {}) => ({
    id, name, meetingFrequency: freq, hoursPerMeeting: hours, ...extra
});

// vitest's default node environment has no localStorage — provide a stub.
beforeEach(() => {
    let store = {};
    globalThis.localStorage = {
        getItem: (k) => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; },
        clear: () => { store = {}; }
    };
});

describe('maybeTakeSnapshot', () => {
    it('takes a first snapshot for a non-empty universe', () => {
        const now = Date.now();
        const result = maybeTakeSnapshot([person('p1', 'Mom')], now);
        expect(result).toHaveLength(1);
        expect(result[0].people[0].name).toBe('Mom');
        expect(loadSnapshots()).toHaveLength(1);
    });

    it('skips empty universes', () => {
        expect(maybeTakeSnapshot([], Date.now())).toHaveLength(0);
    });

    it('throttles to one snapshot per interval', () => {
        const t0 = Date.now();
        maybeTakeSnapshot([person('p1', 'Mom')], t0);
        const after10d = maybeTakeSnapshot([person('p1', 'Mom')], t0 + 10 * DAY);
        expect(after10d).toHaveLength(1);
        const after40d = maybeTakeSnapshot([person('p1', 'Mom')], t0 + 40 * DAY);
        expect(after40d).toHaveLength(2);
    });
});

describe('findComparisonSnapshot', () => {
    it('returns null when history is too fresh', () => {
        const now = Date.now();
        const snaps = [{ takenAt: now - 5 * DAY, people: [] }];
        expect(findComparisonSnapshot(snaps, now)).toBeNull();
    });

    it('prefers the snapshot closest to one year old', () => {
        const now = Date.now();
        const snaps = [
            { takenAt: now - 500 * DAY, people: [person('a', 'A')] },
            { takenAt: now - 370 * DAY, people: [person('b', 'B')] },
            { takenAt: now - 30 * DAY, people: [person('c', 'C')] }
        ];
        const best = findComparisonSnapshot(snaps, now);
        expect(best.people[0].name).toBe('B');
    });

    it('falls back to the oldest eligible snapshot when younger than a year', () => {
        const now = Date.now();
        const snaps = [
            { takenAt: now - 60 * DAY, people: [person('a', 'A')] },
            { takenAt: now - 30 * DAY, people: [person('b', 'B')] }
        ];
        const best = findComparisonSnapshot(snaps, now);
        expect(best.people[0].name).toBe('A');
    });
});

describe('diffUniverse', () => {
    const now = Date.now();
    const base = {
        takenAt: now - 365 * DAY,
        people: [
            person('mom', 'Mom', 12, 2),
            person('friend', 'Ken', 4, 3),
            person('mentor1', 'Sensei', 12, 1, { isMentor: true })
        ]
    };

    it('detects appeared and faded people', () => {
        const diff = diffUniverse(base, [
            person('mom', 'Mom', 12, 2),
            person('mentor1', 'Sensei', 12, 1, { isMentor: true }),
            person('newkid', 'Aiko', 365, 1)
        ], now);
        expect(diff.appeared.map((p) => p.name)).toEqual(['Aiko']);
        expect(diff.faded.map((p) => p.name)).toEqual(['Ken']);
        expect(diff.daysBetween).toBe(365);
    });

    it('detects increased and decreased annual hours', () => {
        const diff = diffUniverse(base, [
            person('mom', 'Mom', 24, 2),     // 24 → 48 h/yr
            person('friend', 'Ken', 1, 3),   // 12 → 3 h/yr
            person('mentor1', 'Sensei', 12, 1, { isMentor: true })
        ], now);
        expect(diff.increased).toHaveLength(1);
        expect(diff.increased[0]).toMatchObject({ name: 'Mom', beforeHoursPerYear: 24, afterHoursPerYear: 48 });
        expect(diff.decreased).toHaveLength(1);
        expect(diff.decreased[0]).toMatchObject({ name: 'Ken', beforeHoursPerYear: 12, afterHoursPerYear: 3 });
    });

    it('detects mentor change', () => {
        const diff = diffUniverse(base, [
            person('mom', 'Mom', 12, 2, { isMentor: true }),
            person('friend', 'Ken', 4, 3),
            person('mentor1', 'Sensei', 12, 1)
        ], now);
        expect(diff.mentorChanged).toEqual({ before: 'Sensei', after: 'Mom' });
    });

    it('hasAnyChange is false for identical universes', () => {
        const diff = diffUniverse(base, [
            person('mom', 'Mom', 12, 2),
            person('friend', 'Ken', 4, 3),
            person('mentor1', 'Sensei', 12, 1, { isMentor: true })
        ], now);
        expect(hasAnyChange(diff)).toBe(false);
    });
});
