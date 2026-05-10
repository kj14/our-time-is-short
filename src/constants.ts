// Centralized magic numbers. Previously these were scattered across
// SolarSystem.jsx (orbit zone distances, hour/meeting thresholds),
// Scene.jsx (camera height), and various components (max people).

// Orbit zone distances from the user (Earth) — radial units in 3D space.
export const ORBIT_DISTANCES = {
    INNER: 6,    // critical
    MIDDLE: 12,  // warning
    OUTER: 20    // stable
} as const;

// Thresholds that decide which orbit zone a person belongs to. A person
// is in the "critical" zone if EITHER their remaining hours OR meetings
// drops below the SOON threshold; "warning" until both pass SOME; etc.
export const HOUR_THRESHOLDS = {
    SOON: 24,
    SOME: 100,
    LOTS: 500
} as const;

export const MEETING_THRESHOLDS = {
    SOON: 10,
    SOME: 50,
    LOTS: 200
} as const;

// Camera defaults
export const CAMERA = {
    DEFAULT_HEIGHT: 65,
    OVERVIEW_HEIGHT: 65,
    ZOOM_DISTANCE: 8
} as const;

// Universe size
export const MAX_PEOPLE = 10;

// Truth Messages
export const TRUTH_MESSAGE_HISTORY_LIMIT = 4;

// Default user values (used as fallbacks before the user's real data is loaded)
export const DEFAULT_USER = {
    age: 44,
    country: 'Japan',
    remainingYears: 40
};
