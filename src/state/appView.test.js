import { describe, it, expect } from 'vitest';
import { viewReducer, initialViewState } from './appView';

describe('viewReducer', () => {
    it('starts with no view flags set', () => {
        expect(initialViewState.isSettingsOpen).toBe(false);
        expect(initialViewState.visualizingPersonId).toBe(null);
        expect(initialViewState.selectedPersonId).toBe(null);
    });

    it('OPEN_SETTINGS opens modal and remembers editingPersonId', () => {
        const next = viewReducer(initialViewState, { type: 'OPEN_SETTINGS', editingPersonId: 'p1' });
        expect(next.isSettingsOpen).toBe(true);
        expect(next.editingPersonId).toBe('p1');
        expect(next.isEarthZoomed).toBe(false);
    });

    it('CLOSE_SETTINGS clears editingPersonId', () => {
        const opened = viewReducer(initialViewState, { type: 'OPEN_SETTINGS', editingPersonId: 'p1' });
        const closed = viewReducer(opened, { type: 'CLOSE_SETTINGS' });
        expect(closed.isSettingsOpen).toBe(false);
        expect(closed.editingPersonId).toBe(null);
    });

    it('EARTH_CLICK from countdown mode clears visualization + selection', () => {
        const start = { ...initialViewState, visualizingPersonId: 'p1', selectedPersonId: 'p2' };
        const next = viewReducer(start, { type: 'EARTH_CLICK', isValidUser: false });
        expect(next.visualizingPersonId).toBe(null);
        expect(next.selectedPersonId).toBe(null);
    });

    it('EARTH_CLICK from a star\'s settings goes to overview', () => {
        const start = { ...initialViewState, selectedPersonId: 'p1' };
        const next = viewReducer(start, { type: 'EARTH_CLICK', isValidUser: false });
        expect(next.selectedPersonId).toBe(null);
        expect(next.isOverviewMode).toBe(true);
    });

    it('EARTH_CLICK from overview returns to user settings (zoom)', () => {
        const start = { ...initialViewState, isOverviewMode: true };
        const next = viewReducer(start, { type: 'EARTH_CLICK', isValidUser: false });
        expect(next.isOverviewMode).toBe(false);
    });

    it('PERSON_CLICK on the same selected star goes to overview', () => {
        const start = { ...initialViewState, selectedPersonId: 'p1' };
        const next = viewReducer(start, { type: 'PERSON_CLICK', personId: 'p1', isValidUser: false });
        expect(next.selectedPersonId).toBe(null);
        expect(next.isOverviewMode).toBe(true);
    });

    it('PERSON_CLICK from overview zooms into that star', () => {
        const start = { ...initialViewState, isOverviewMode: true };
        const next = viewReducer(start, { type: 'PERSON_CLICK', personId: 'p2', isValidUser: false });
        expect(next.selectedPersonId).toBe('p2');
        expect(next.isOverviewMode).toBe(false);
    });

    it('SUN_CLICK opens settings only when valid user', () => {
        const next = viewReducer(initialViewState, { type: 'SUN_CLICK', isValidUser: true });
        expect(next.isSettingsOpen).toBe(true);
        const noOp = viewReducer(initialViewState, { type: 'SUN_CLICK', isValidUser: false });
        expect(noOp.isSettingsOpen).toBe(false);
    });

    it('VISUALIZE accepts null (back to "You")', () => {
        const start = { ...initialViewState, visualizingPersonId: 'p1' };
        const next = viewReducer(start, { type: 'VISUALIZE', personId: null });
        expect(next.visualizingPersonId).toBe(null);
    });

    it('RESET closes settings/detail/overview but preserves selection', () => {
        const start = {
            ...initialViewState,
            isSettingsOpen: true,
            isDetailPageOpen: true,
            isOverviewMode: true,
            selectedPersonId: 'p1'
        };
        const next = viewReducer(start, { type: 'RESET' });
        expect(next.isSettingsOpen).toBe(false);
        expect(next.isDetailPageOpen).toBe(false);
        expect(next.isOverviewMode).toBe(false);
        expect(next.selectedPersonId).toBe('p1');
    });

    it('unknown action returns state unchanged', () => {
        expect(viewReducer(initialViewState, { type: 'NOPE' })).toBe(initialViewState);
    });
});
