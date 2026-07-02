import { describe, it, expect } from 'vitest';
import { buildExportBundle, applyImport, SCHEMA_VERSION } from './dataPortability';
import { safeGet, safeSet } from './storage';

// In the node test env there is no window.localStorage, so storage.ts
// transparently uses its in-memory fallback — which is exactly what we
// exercise here.

describe('dataPortability', () => {
    it('exports a versioned bundle of the persisted keys', () => {
        safeSet('lifevis_userData', JSON.stringify({ country: 'Japan', age: 40 }));
        safeSet('lifevis_centerMode', 'mentor');
        const bundle = buildExportBundle('2026-07-02T00:00:00.000Z');

        expect(bundle.app).toBe('our-time-is-short');
        expect(bundle.schemaVersion).toBe(SCHEMA_VERSION);
        expect(bundle.exportedAt).toBe('2026-07-02T00:00:00.000Z');
        expect(bundle.data['lifevis_centerMode']).toBe('mentor');
        expect(JSON.parse(bundle.data['lifevis_userData']).country).toBe('Japan');
    });

    it('round-trips: export then import restores values', () => {
        safeSet('lifevis_displayMode', 'time');
        const json = JSON.stringify(buildExportBundle('2026-07-02T00:00:00.000Z'));
        safeSet('lifevis_displayMode', 'percentage'); // clobber
        const res = applyImport(json);
        expect(res.ok).toBe(true);
        expect(safeGet('lifevis_displayMode')).toBe('time');
    });

    it('rejects non-JSON', () => {
        expect(applyImport('not json {')).toEqual({ ok: false, error: 'parse' });
    });

    it('rejects a bundle from a different app', () => {
        const foreign = JSON.stringify({ app: 'something-else', data: { lifevis_centerMode: 'self' } });
        expect(applyImport(foreign)).toEqual({ ok: false, error: 'invalid' });
    });

    it('ignores unknown keys and non-string values (no injection)', () => {
        const hostile = JSON.stringify({
            app: 'our-time-is-short',
            data: { evil_key: 'x', lifevis_centerMode: 'self', lifevis_people: { not: 'a string' } }
        });
        const res = applyImport(hostile);
        expect(res.ok).toBe(true); // one valid key applied
        expect(safeGet('lifevis_centerMode')).toBe('self');
        expect(safeGet('evil_key')).toBeNull();
    });

    it('rejects a bundle with no applicable keys', () => {
        const empty = JSON.stringify({ app: 'our-time-is-short', data: { evil_key: 'x' } });
        expect(applyImport(empty)).toEqual({ ok: false, error: 'invalid' });
    });
});
