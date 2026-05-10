// View-state reducer for App. Consolidates the 8 boolean/id flags that
// describe "what is the user looking at right now" into a single state
// object. Compound transitions (Earth click, Person click) live here so
// the App component dispatches domain intents instead of orchestrating
// 3-line setter sequences inline.

export const initialViewState = {
    isSettingsOpen: false,
    isDetailPageOpen: false,
    editingPersonId: null,
    isOverviewMode: false,
    isAddingPerson: false,
    selectedPersonId: null,    // person whose star is zoomed for editing
    visualizingPersonId: null, // person whose countdown is shown (null = "You")
    isEarthZoomed: false
};

export function viewReducer(state, action) {
    switch (action.type) {
        case 'RESET':
            // handleReset: close detail/settings/overview, but don't touch
            // selection or visualization (those are cleared by EARTH_CLICK
            // before RESET fires).
            return {
                ...state,
                isDetailPageOpen: false,
                isSettingsOpen: false,
                isOverviewMode: false
            };

        case 'OPEN_SETTINGS':
            return {
                ...state,
                isSettingsOpen: true,
                editingPersonId: action.editingPersonId ?? null,
                isEarthZoomed: false
            };

        case 'CLOSE_SETTINGS':
            return {
                ...state,
                isSettingsOpen: false,
                editingPersonId: null,
                isEarthZoomed: false
            };

        case 'OPEN_DETAIL':
            return { ...state, isSettingsOpen: false, isDetailPageOpen: true };

        case 'CLOSE_DETAIL':
            return { ...state, isDetailPageOpen: false };

        case 'START_ADD_PERSON':
            return { ...state, isAddingPerson: true };

        case 'CANCEL_ADD_PERSON':
            return { ...state, isAddingPerson: false };

        case 'FINISH_ADD_PERSON':
            return { ...state, isAddingPerson: false };

        case 'SELECT_PERSON_FOR_EDIT':
            return { ...state, selectedPersonId: action.personId };

        case 'DESELECT_PERSON':
            return { ...state, selectedPersonId: null };

        case 'VISUALIZE':
            return { ...state, visualizingPersonId: action.personId ?? null };

        case 'STOP_VISUALIZING':
            return { ...state, visualizingPersonId: null };

        case 'SET_OVERVIEW':
            return { ...state, isOverviewMode: !!action.mode };

        // Compound transitions — replicate the original handlers exactly.

        case 'EARTH_CLICK':
            // From countdown mode (own or person's): clear visualization +
            // selection, RESET will close detail/settings/overview, and the
            // App separately calls setUserData(null) to re-show settings.
            if (state.visualizingPersonId || action.isValidUser) {
                return {
                    ...state,
                    visualizingPersonId: null,
                    selectedPersonId: null,
                    isDetailPageOpen: false,
                    isSettingsOpen: false,
                    isOverviewMode: false
                };
            }
            // From a star's settings: go to overview
            if (state.selectedPersonId) {
                return { ...state, selectedPersonId: null, isOverviewMode: true };
            }
            // From overview: go back to user settings (zoom to Earth)
            if (state.isOverviewMode) {
                return { ...state, isOverviewMode: false };
            }
            // From user settings: go to overview
            return { ...state, isOverviewMode: true };

        case 'PERSON_CLICK': {
            const { personId, isValidUser } = action;
            // From countdown mode: zoom to that star's settings; App
            // separately clears userData to show the settings UI.
            if (state.visualizingPersonId || isValidUser) {
                return {
                    ...state,
                    visualizingPersonId: null,
                    selectedPersonId: personId
                };
            }
            // Tapping the same star in settings mode → overview
            if (state.selectedPersonId === personId) {
                return { ...state, selectedPersonId: null, isOverviewMode: true };
            }
            // Tapping another star while editing one → overview first
            if (state.selectedPersonId) {
                return { ...state, selectedPersonId: null, isOverviewMode: true };
            }
            // From overview → zoom to that star's settings
            if (state.isOverviewMode) {
                return { ...state, selectedPersonId: personId, isOverviewMode: false };
            }
            // From user settings → overview
            return { ...state, isOverviewMode: true };
        }

        case 'SUN_CLICK':
            // The sun opens settings, but only when the user has been
            // identified (isValidUser). Otherwise it's a no-op besides
            // dropping the earth-zoomed flag.
            if (action.isValidUser) {
                return {
                    ...state,
                    isEarthZoomed: false,
                    editingPersonId: null,
                    isSettingsOpen: true
                };
            }
            return { ...state, isEarthZoomed: false };

        default:
            return state;
    }
}
