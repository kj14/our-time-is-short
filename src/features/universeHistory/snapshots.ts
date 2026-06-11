// Universe history — CONCEPT.md §11 "Visualizing Change".
// Periodically snapshot the user's universe (people + key settings) into
// localStorage, then diff "now" against the snapshot closest to one year
// ago to show who appeared, who faded, and how meeting habits changed.
//
// Storage: lifevis_snapshots = JSON array of UniverseSnapshot, oldest
// first, capped at MAX_SNAPSHOTS. A new snapshot is appended at most
// once every SNAPSHOT_INTERVAL_DAYS.

import type { Person, Relationship } from '../../types';

const STORAGE_KEY = 'lifevis_snapshots';
const SNAPSHOT_INTERVAL_DAYS = 30;
const MAX_SNAPSHOTS = 25; // ~2 years of monthly snapshots
const TARGET_LOOKBACK_DAYS = 365;
// Don't bother showing a comparison until the universe has some history.
const MIN_COMPARISON_AGE_DAYS = 25;

export interface SnapshotPerson {
    id: string;
    name: string;
    relationship?: Relationship | string;
    isMentor?: boolean;
    meetingFrequency: number;
    hoursPerMeeting: number;
}

export interface UniverseSnapshot {
    takenAt: number; // epoch ms
    people: SnapshotPerson[];
}

export interface PersonChange {
    id: string;
    name: string;
    // Annual shared hours then vs now (meetingFrequency × hoursPerMeeting).
    beforeHoursPerYear: number;
    afterHoursPerYear: number;
}

export interface UniverseDiff {
    daysBetween: number;
    appeared: SnapshotPerson[];       // in current, not in snapshot
    faded: SnapshotPerson[];          // in snapshot, not in current
    increased: PersonChange[];        // annual hours went up
    decreased: PersonChange[];        // annual hours went down
    mentorChanged: { before: string | null; after: string | null } | null;
}

const toSnapshotPerson = (p: Person | SnapshotPerson): SnapshotPerson => ({
    id: p.id,
    name: p.name,
    relationship: p.relationship,
    isMentor: !!p.isMentor,
    meetingFrequency: p.meetingFrequency || 0,
    hoursPerMeeting: p.hoursPerMeeting || 0
});

export function loadSnapshots(): UniverseSnapshot[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveSnapshots(snapshots: UniverseSnapshot[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots.slice(-MAX_SNAPSHOTS)));
    } catch {
        // Quota exceeded or private mode — history is best-effort.
    }
}

// Append a snapshot if the latest one is older than the interval (or none
// exists). Skips empty universes so a fresh install doesn't burn the slot.
// Returns the (possibly updated) snapshot list. `now` injectable for tests.
export function maybeTakeSnapshot(
    people: Person[],
    now: number = Date.now()
): UniverseSnapshot[] {
    const snapshots = loadSnapshots();
    if (people.length === 0) return snapshots;

    const latest = snapshots[snapshots.length - 1];
    const intervalMs = SNAPSHOT_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
    if (latest && now - latest.takenAt < intervalMs) return snapshots;

    const next = [...snapshots, { takenAt: now, people: people.map(toSnapshotPerson) }];
    saveSnapshots(next);
    return next.slice(-MAX_SNAPSHOTS);
}

// Pick the snapshot whose age is closest to one year, provided it's at
// least MIN_COMPARISON_AGE_DAYS old. Returns null when history is too new.
export function findComparisonSnapshot(
    snapshots: UniverseSnapshot[],
    now: number = Date.now()
): UniverseSnapshot | null {
    const minAgeMs = MIN_COMPARISON_AGE_DAYS * 24 * 60 * 60 * 1000;
    const eligible = snapshots.filter((s) => now - s.takenAt >= minAgeMs);
    if (eligible.length === 0) return null;

    const targetMs = TARGET_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
    return eligible.reduce((best, s) =>
        Math.abs((now - s.takenAt) - targetMs) < Math.abs((now - best.takenAt) - targetMs) ? s : best
    );
}

const annualHours = (p: SnapshotPerson) => (p.meetingFrequency || 0) * (p.hoursPerMeeting || 0);

export function diffUniverse(
    snapshot: UniverseSnapshot,
    currentPeople: Person[],
    now: number = Date.now()
): UniverseDiff {
    const current = currentPeople.map(toSnapshotPerson);
    const beforeById = new Map(snapshot.people.map((p) => [p.id, p]));
    const afterById = new Map(current.map((p) => [p.id, p]));

    const appeared = current.filter((p) => !beforeById.has(p.id));
    const faded = snapshot.people.filter((p) => !afterById.has(p.id));

    const increased: PersonChange[] = [];
    const decreased: PersonChange[] = [];
    for (const after of current) {
        const before = beforeById.get(after.id);
        if (!before) continue;
        const beforeH = annualHours(before);
        const afterH = annualHours(after);
        if (afterH === beforeH) continue;
        const change: PersonChange = {
            id: after.id,
            name: after.name,
            beforeHoursPerYear: beforeH,
            afterHoursPerYear: afterH
        };
        (afterH > beforeH ? increased : decreased).push(change);
    }

    const beforeMentor = snapshot.people.find((p) => p.isMentor)?.name ?? null;
    const afterMentor = current.find((p) => p.isMentor)?.name ?? null;
    const mentorChanged = beforeMentor !== afterMentor
        ? { before: beforeMentor, after: afterMentor }
        : null;

    return {
        daysBetween: Math.round((now - snapshot.takenAt) / (24 * 60 * 60 * 1000)),
        appeared,
        faded,
        increased,
        decreased,
        mentorChanged
    };
}

export function hasAnyChange(diff: UniverseDiff): boolean {
    return diff.appeared.length > 0
        || diff.faded.length > 0
        || diff.increased.length > 0
        || diff.decreased.length > 0
        || diff.mentorChanged !== null;
}
