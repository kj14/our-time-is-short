// Safe localStorage access.
//
// Private-browsing modes, locked-down enterprise browsers, and full-quota
// states can make `window.localStorage` throw on *access* (not just write).
// When that happens we degrade to an in-memory map so the app still mounts
// and stays usable for the session — the philosophy is "your data stays on
// your device," so silently losing persistence for one session is far kinder
// than crashing to the error boundary on a fresh visit.
//
// This is the single source of truth for storage access; components should
// never touch window.localStorage directly.

const memory = new Map<string, string>();
let available: boolean | null = null;

function storageAvailable(): boolean {
    if (available !== null) return available;
    try {
        const probe = '__lifevis_probe__';
        window.localStorage.setItem(probe, '1');
        window.localStorage.removeItem(probe);
        available = true;
    } catch {
        available = false;
    }
    return available;
}

/** True when real localStorage is usable; false when we're on the in-memory fallback. */
export function isPersistent(): boolean {
    return storageAvailable();
}

export function safeGet(key: string): string | null {
    if (storageAvailable()) {
        try {
            return window.localStorage.getItem(key);
        } catch {
            /* fall through to memory */
        }
    }
    return memory.has(key) ? memory.get(key)! : null;
}

export function safeSet(key: string, value: string): void {
    if (storageAvailable()) {
        try {
            window.localStorage.setItem(key, value);
            return;
        } catch {
            /* quota or transient failure — fall through to memory */
        }
    }
    memory.set(key, value);
}

export function safeRemove(key: string): void {
    if (storageAvailable()) {
        try {
            window.localStorage.removeItem(key);
        } catch {
            /* ignore */
        }
    }
    memory.delete(key);
}

/** Read + JSON.parse a key, returning `fallback` on any miss or parse error. */
export function safeGetJSON<T>(key: string, fallback: T): T {
    const raw = safeGet(key);
    if (raw == null) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

/** JSON.stringify + write a key. Serialization/write failures are swallowed. */
export function safeSetJSON(key: string, value: unknown): void {
    try {
        safeSet(key, JSON.stringify(value));
    } catch {
        /* ignore */
    }
}
