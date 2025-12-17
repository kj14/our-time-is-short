# Test Coverage Analysis

## Executive Summary

**Current Test Coverage: 0%**

This codebase currently has **no automated tests**. There is no testing framework installed, no test files, and no test configuration. This represents a significant risk for a production application, especially one that performs critical life-expectancy calculations that users rely on for meaningful decisions.

---

## Current State

### What Exists
- ESLint for code linting
- TypeScript type definitions (dev dependencies only)
- No test runner (Jest, Vitest, etc.)
- No testing utilities (React Testing Library, etc.)
- No test files anywhere in the codebase

### Risk Assessment
| Risk Level | Area | Impact |
|------------|------|--------|
| **Critical** | Life calculation logic | Incorrect calculations could mislead users about their remaining time |
| **High** | Age calculation from birthdate | Edge cases (leap years, timezone) could produce wrong ages |
| **High** | localStorage persistence | Data corruption could lose user's precious people settings |
| **Medium** | Navigation state machine | Complex flows could break silently |
| **Low** | 3D rendering | Visual issues are immediately apparent |

---

## Recommended Testing Framework

Given this is a Vite + React project, I recommend **Vitest** with **React Testing Library**:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Configuration (`vitest.config.js`)
```javascript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
```

---

## Priority 1: Critical - Core Calculation Logic

### File: `src/utils/lifeData.js`

The `calculateLifeStats()` function is the heart of the application. It must be tested thoroughly.

#### Test Cases Needed:

**1. Basic Calculations**
```javascript
// Test: remainingYears calculation
calculateLifeStats('Japan', 30)
// Expected: remainingYears = 84.6 - 30 = 54.6

// Test: remainingWeeks calculation
// remainingYears * 52.1429

// Test: remainingSeconds calculation
// remainingYears * 365.25 * 24 * 60 * 60
```

**2. Edge Cases**
```javascript
// Test: Age equals life expectancy
calculateLifeStats('Japan', 84.6)
// Expected: remainingYears = 0, all breakdowns = 0

// Test: Age exceeds life expectancy
calculateLifeStats('Japan', 100)
// Expected: remainingYears = 0 (not negative)

// Test: Very young age
calculateLifeStats('Japan', 1)
// Expected: Should handle correctly

// Test: Age = 0 (newborn)
calculateLifeStats('Japan', 0)
// Expected: remainingYears = lifeExpectancy
```

**3. Country Fallbacks**
```javascript
// Test: Unknown country falls back to Global
calculateLifeStats('UnknownCountry', 30)
// Expected: uses Global life expectancy (73.2)

// Test: Custom life expectancy overrides country
calculateLifeStats('Japan', 30, 90)
// Expected: uses 90, not 84.6
```

**4. Breakdown Calculations**
```javascript
// Test: "Time with Parents" calculation
// Verify: Uses parent age estimate (age + 30), capped at remaining years

// Test: "Time with Children" excluded for age >= 60
calculateLifeStats('Japan', 65)
// Expected: breakdown["Time with Children"] should be undefined

// Test: "Time with Children" included for age < 60
calculateLifeStats('Japan', 35)
// Expected: breakdown["Time with Children"] should exist
```

**5. Mathematical Precision**
```javascript
// Test: Verify weeks use 52.1429 (not 52)
// Test: Verify seconds use 365.25 days (leap year consideration)
```

---

## Priority 2: High - Age Calculation Logic

### File: `src/components/InputSection.jsx`

The `calculateAge()` function handles birthdate-to-age conversion.

#### Test Cases Needed:

**1. Basic Age Calculation**
```javascript
// Test: Simple case - birthday has passed this year
// Birthdate: 1990-01-15, Today: 2024-06-15
// Expected: 34

// Test: Birthday hasn't occurred yet this year
// Birthdate: 1990-12-15, Today: 2024-06-15
// Expected: 33 (not 34)
```

**2. Precise Age with Decimals**
```javascript
// Test: Mid-year age calculation
// Should return decimal age (e.g., 34.5 for someone 6 months past birthday)
```

**3. Edge Cases**
```javascript
// Test: Leap year birthdate (Feb 29)
// Birthdate: 2000-02-29
// How does it handle non-leap years?

// Test: Birthday is today
// Expected: Age increments exactly

// Test: End of year edge case
// Birthdate: 2000-12-31, Today: 2024-12-30
// Expected: 23 (not 24)

// Test: Start of year edge case
// Birthdate: 2000-01-01, Today: 2024-01-01
// Expected: 24
```

**4. `getDaysInMonth()` Function**
```javascript
// Test: February in leap year
getDaysInMonth(2024, 2) // Expected: 29

// Test: February in non-leap year
getDaysInMonth(2023, 2) // Expected: 28

// Test: 31-day months
getDaysInMonth(2024, 1) // Expected: 31 (January)
getDaysInMonth(2024, 3) // Expected: 31 (March)

// Test: 30-day months
getDaysInMonth(2024, 4) // Expected: 30 (April)

// Test: Edge case - empty inputs
getDaysInMonth('', '') // Expected: 31 (default)
```

### File: `src/components/PersonSettings.jsx`

Similar age calculation logic exists here and should be tested.

#### Additional Test Cases:

**1. `calculateSharedTime()` Function**
```javascript
// Test: Basic shared time calculation
// formData = { meetingFrequency: 12, hoursPerMeeting: 2 }
// Expected: totalMeetings = remainingYears * 12
//           totalHours = totalMeetings * 2
//           totalDays = totalHours / 24

// Test: Person older than user (less time remaining)
// Person age: 80, User age: 44
// Expected: Uses person's remaining years, not user's

// Test: Person younger than user
// Person age: 20, User age: 44
// Expected: Uses user's remaining years
```

**2. Form Validation**
```javascript
// Test: Save without name
// Expected: Alert shown, save prevented

// Test: Save without birthdate AND without age
// Expected: Alert shown, save prevented

// Test: Save with only age (no birthdate)
// Expected: Should work

// Test: Save with only birthdate (no age)
// Expected: Should work, age calculated automatically
```

---

## Priority 3: High - State Persistence

### File: `src/App.jsx`

localStorage interactions need testing to ensure data integrity.

#### Test Cases Needed:

**1. Initial Load from localStorage**
```javascript
// Test: No saved data
// Expected: userData = null, people = []

// Test: Saved userData exists
localStorage.setItem('lifevis_userData', JSON.stringify({
  country: 'Japan', age: 30
}))
// Expected: userData loaded with defaults filled in

// Test: Corrupted JSON in localStorage
localStorage.setItem('lifevis_people', 'invalid json')
// Expected: Gracefully falls back to []
```

**2. Data Migration**
```javascript
// Test: Old data without lifeExpectancy field
// Expected: lifeExpectancy auto-populated from country

// Test: Old data without healthyLifeExpectancy
// Expected: healthyLifeExpectancy auto-populated

// Test: Old data without workingAgeLimit
// Expected: workingAgeLimit auto-populated
```

**3. Save to localStorage**
```javascript
// Test: userData changes trigger save
// Test: people array changes trigger save
// Test: calculationBasis changes trigger save
```

---

## Priority 4: Medium - Navigation State Machine

### File: `src/App.jsx`

The app has a complex navigation state with multiple modes.

#### State Combinations to Test:

| Current State | Action | Expected Result |
|--------------|--------|-----------------|
| Input mode | Submit form | → Visualization mode |
| Visualization | Click Earth | → Overview mode |
| Overview | Click Earth | → Input mode |
| Overview | Click Star | → Person settings |
| Person settings | Click same star | → Overview |
| Visualization | Click Star | → Person settings |
| Person visualization | Navigate | → Next/prev person |

#### Test Cases:
```javascript
// Test: navigateTo('next') cycles through people
// Items: [null (You), person1, person2]
// Current: null → Next: person1

// Test: navigateTo('prev') wraps around
// Current: null → Prev: person2 (last item)

// Test: handleEarthClick from various states
// Test: onPersonClick from various states
```

---

## Priority 5: Medium - Component Rendering

### InputSection Component
```javascript
// Test: Renders country dropdown with all countries
// Test: Renders year dropdown (current year - 120)
// Test: Days dropdown updates based on month selection
// Test: Calculated age displays correctly
// Test: Form submission calls onVisualize with correct params
```

### PersonSettings Component
```javascript
// Test: New person mode (person = null)
// Test: Edit mode (person exists)
// Test: Planet selection updates textureUrl
// Test: Frequency/hours options render correctly
// Test: Delete button only shows when editing
// Test: Visualize button only shows when editing
```

### Visualization Component
```javascript
// Test: Countdown timer decrements correctly
// Test: Display mode toggle works (percentage/hours)
// Test: Settings button opens modal
```

---

## Priority 6: Low - 3D Components (Integration/Visual)

3D components (`Scene.jsx`, `SolarSystem.jsx`, `Earth3D.jsx`) are difficult to unit test. Consider:

1. **Snapshot testing** for rendered canvas output
2. **Integration tests** verifying props are passed correctly
3. **Visual regression testing** with tools like Chromatic/Percy

---

## Recommended Test File Structure

```
src/
├── __tests__/
│   └── App.test.jsx
├── utils/
│   └── __tests__/
│       └── lifeData.test.js
├── components/
│   └── __tests__/
│       ├── InputSection.test.jsx
│       ├── PersonSettings.test.jsx
│       ├── Visualization.test.jsx
│       ├── DetailPage.test.jsx
│       └── PersonVisualization.test.jsx
└── test/
    └── setup.js
```

---

## Implementation Roadmap

### Phase 1: Foundation (Immediate)
1. Install Vitest + React Testing Library
2. Configure test environment
3. Write tests for `calculateLifeStats()` - 15-20 test cases
4. Write tests for `calculateAge()` functions - 10-15 test cases

### Phase 2: Data Layer
1. Test localStorage persistence
2. Test data migration/defaults
3. Test form validation

### Phase 3: UI Components
1. InputSection tests
2. PersonSettings tests
3. Navigation state machine tests

### Phase 4: Integration
1. Full user flow tests
2. Cross-component interaction tests

---

## Metrics Target

| Metric | Current | Target |
|--------|---------|--------|
| Statement Coverage | 0% | 80% |
| Branch Coverage | 0% | 70% |
| Function Coverage | 0% | 90% |
| Critical Path Coverage | 0% | 100% |

---

## Summary

The most impactful areas to test are:

1. **`calculateLifeStats()`** - Core business logic that users depend on
2. **Age calculations** - Multiple implementations with date edge cases
3. **localStorage persistence** - User data integrity
4. **Form validation** - Prevent invalid data entry
5. **Navigation state** - Complex UI state machine

Investing in tests for these areas will significantly improve confidence in the application's correctness and make future development safer.
