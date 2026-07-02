// Data portability (CONCEPT §5: your data is yours).
//
// localStorage is the only persistence, so a browser-data wipe or a new
// device silently erases the universe a user has built. Export bundles all
// lifevis_* keys into one versioned JSON file the user can save and re-import
// anywhere. Nothing is sent to a server — this is a local file, by hand.

import { safeGet, safeSet } from './storage';

// Every persisted key. Keep in sync with the setters across the app.
const KEYS = [
    'lifevis_userData',
    'lifevis_people',
    'lifevis_calculationBasis',
    'lifevis_displayMode',
    'lifevis_centerMode',
    'lifevis_language',
    'lifevis_country',
    'lifevis_year',
    'lifevis_month',
    'lifevis_day',
    'lifevis_snapshots',
    'lifevis_hasOnboarded'
] as const;

// v1: pre-relationship people. v2: people carry relationship + isMentor
// (migrated on load in App). Bumped here when the persisted shape changes.
export const SCHEMA_VERSION = 2;
const APP_ID = 'our-time-is-short';

export interface ExportBundle {
    app: string;
    schemaVersion: number;
    exportedAt: string;
    data: Record<string, string>;
}

export function buildExportBundle(nowISO: string): ExportBundle {
    const data: Record<string, string> = {};
    for (const k of KEYS) {
        const v = safeGet(k);
        if (v != null) data[k] = v;
    }
    return { app: APP_ID, schemaVersion: SCHEMA_VERSION, exportedAt: nowISO, data };
}

export function downloadExport(): void {
    const nowISO = new Date().toISOString();
    const bundle = buildExportBundle(nowISO);
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `our-time-is-short-backup-${nowISO.slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoke on the next tick so the download has time to start.
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

export type ImportResult = { ok: true } | { ok: false; error: 'parse' | 'invalid' };

// Validate + write a bundle's keys. Only known keys with string values are
// applied, so a malformed/hostile file can't inject arbitrary storage. The
// caller reloads afterward so all state re-hydrates through the load-time
// migrations in App.
export function applyImport(json: string): ImportResult {
    let parsed: unknown;
    try {
        parsed = JSON.parse(json);
    } catch {
        return { ok: false, error: 'parse' };
    }
    if (
        !parsed ||
        typeof parsed !== 'object' ||
        (parsed as any).app !== APP_ID ||
        typeof (parsed as any).data !== 'object' ||
        (parsed as any).data === null
    ) {
        return { ok: false, error: 'invalid' };
    }
    const data = (parsed as any).data as Record<string, unknown>;
    const allowed = new Set<string>(KEYS);
    let wrote = 0;
    for (const [k, v] of Object.entries(data)) {
        if (allowed.has(k) && typeof v === 'string') {
            safeSet(k, v);
            wrote++;
        }
    }
    if (wrote === 0) return { ok: false, error: 'invalid' };
    return { ok: true };
}
