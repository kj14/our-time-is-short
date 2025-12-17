# CLAUDE.md - AI Assistant Guide

> **Last Updated:** December 2025
> **Project:** Our Time Is Short - Life Visualization Tool
> **Repository:** kj14/our-time-is-short

## Table of Contents

1. [Project Overview](#project-overview)
2. [Philosophy & Core Concepts](#philosophy--core-concepts)
3. [Technology Stack](#technology-stack)
4. [Repository Structure](#repository-structure)
5. [Architecture & Data Flow](#architecture--data-flow)
6. [Code Conventions](#code-conventions)
7. [Development Workflow](#development-workflow)
8. [Key Components](#key-components)
9. [State Management](#state-management)
10. [Common Tasks](#common-tasks)
11. [Deployment](#deployment)
12. [Important Considerations](#important-considerations)

---

## Project Overview

**"Our Time Is Short"** is a life visualization tool that helps users stop postponing their lives by visualizing their remaining time. The app uses the metaphor of a personal universe where users can place up to 10 precious people and see how much time they have left to spend with them.

**Live Site:** https://letmeknow.life

### Key Features

- **Time Countdown**: Visualize remaining life, healthy life expectancy, and working years as battery tanks
- **Personal Universe**: Place up to 10 precious people in a 3D solar system visualization
- **Truth Messages**: Data-based messages that appear on each access (e.g., "Christmas with your son: 12 remaining")
- **3D Visualization**: Interactive Three.js-based solar system representing the user's universe
- **Bilingual**: Japanese and English support throughout

### Project Status

- **Alpha Version** - Active development, expect bugs and incomplete features
- Built for personal use first, evolving constantly
- Open source under MIT License

---

## Philosophy & Core Concepts

Understanding the philosophy is crucial for making appropriate design decisions:

### Core Philosophy

> **"Time feels infinite only because we cannot see it."**
> **"時間は見えないから、無限にあるように感じてしまう。"**

This is not just a time visualization app—it's a project to enrich life by:

1. **Liberation** - Realizing there's no time to waste on worrying
2. **Courage** - Realizing there's not a second to spend on people you dislike
3. **Gentleness** - As time becomes visible, daily noise fades and what matters becomes clear
4. **Action** - Transforming vague anxiety into concrete actions

### Key Design Principles

1. **Data-Based Truth, Not Spiritual**
   - Not "Today's message for you" but "Christmas with your son: 12 remaining"
   - Mathematical facts based on user input data
   - Express in "count" not just "time" (more impactful)

2. **No Fear, Only Liberation**
   - Don't instill fear or urgency
   - Give liberation and courage instead
   - Help users become gentler as noise fades

3. **Subtraction over Addition**
   - Courage to let go
   - Focus on what truly matters
   - Half a step forward, not a giant leap

4. **Respect Privacy**
   - User's universe doesn't need to be visible to others
   - Data stored locally (localStorage)
   - No backend/server tracking

### The Universe Metaphor

- **User at the center** (the sun) by default, or can place someone else (mentor, passed loved one)
- **Precious people** = Stars/Planets (distance, orbit, brightness)
- **Up to 10 people** maximum
- **Universe changes** as you change through life stages

---

## Technology Stack

### Core Technologies

- **React 19.2.0** - UI framework
- **Three.js 0.181.2** - 3D graphics engine
- **@react-three/fiber 9.4.2** - React renderer for Three.js
- **@react-three/drei 10.7.7** - Useful helpers for react-three-fiber
- **Vite 7.2.4** - Build tool and dev server
- **html2canvas 1.4.1** - For screenshot/sharing functionality

### Development Tools

- **ESLint 9.39.1** - Linting with React hooks and refresh plugins
- **Node.js 20.19.0** - Runtime (specified in GitHub Actions)
- **npm** - Package manager

### Hosting & Deployment

- **GitHub Pages** - Static site hosting
- **GitHub Actions** - CI/CD pipeline
- **Custom Domain:** letmeknow.life (via CNAME)

---

## Repository Structure

```
our-time-is-short/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── public/
│   ├── images/                 # Background images (bg1-5)
│   ├── textures/               # Planet textures (2k resolution)
│   │   ├── 2k_earth_daymap.jpg
│   │   ├── 2k_sun.jpg
│   │   ├── 2k_mars.jpg
│   │   └── ... (all planets)
│   ├── vite.svg
│   └── CNAME                   # Custom domain configuration
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── components/             # React components (see below)
│   │   ├── App.jsx             # Main application component
│   │   ├── DetailPage.jsx      # Detailed stats page
│   │   ├── DigitalHourglass.jsx
│   │   ├── DigitalHourglassScene.jsx
│   │   ├── Earth.jsx
│   │   ├── Earth3D.jsx
│   │   ├── EnergyTank.jsx
│   │   ├── InputSection.jsx
│   │   ├── ParticleBackground.jsx
│   │   ├── PersonSettings.jsx
│   │   ├── PersonVisualization.jsx
│   │   ├── Scene.jsx           # Main 3D scene orchestrator
│   │   ├── SolarSystem.jsx
│   │   └── Visualization.jsx
│   ├── utils/
│   │   └── lifeData.js         # Core data and calculations
│   ├── index.css               # Global styles
│   └── main.jsx                # Entry point with ErrorBoundary
├── .gitignore
├── CLAUDE.md                   # This file
├── CNAME                       # Domain config (duplicate)
├── CONCEPT.md                  # Full concept documentation
├── LICENSE                     # MIT License
├── README.md                   # User-facing documentation
├── eslint.config.js            # ESLint configuration
├── index.html                  # HTML entry point
├── package.json                # Dependencies and scripts
├── package-lock.json
└── vite.config.js              # Vite build configuration
```

---

## Architecture & Data Flow

### Application Modes

The app has multiple distinct modes with complex state transitions:

1. **User Settings Mode** (Earth zoomed)
   - Initial state when no user data exists
   - Shows `InputSection` component
   - User enters country and age

2. **User Visualization Mode** (Earth with countdown)
   - After user submits data
   - Shows `Visualization` component with countdown
   - Earth displays particles representing remaining time

3. **Overview Mode** (Solar system view)
   - Shows all planets/people in the universe
   - Can add new people (+button)
   - Can click on planets to zoom to them

4. **Person Settings Mode** (Star/planet zoomed)
   - Edit or create a person's details
   - Shows `PersonSettings` component
   - Set relationship, meeting frequency, etc.

5. **Person Visualization Mode** (Star with countdown)
   - Shows time remaining with that specific person
   - Shows `PersonVisualization` component
   - Can navigate between people

### State Flow Diagram

```
User Settings Mode (Earth)
    ↓ (submit data)
User Visualization Mode (Earth countdown)
    ↓ (Earth click)
User Settings Mode
    ↓ (Earth click)
Overview Mode (Solar system)
    ↓ (+ button)
Person Settings Mode (new person)
    ↓ (save)
Overview Mode
    ↓ (click planet)
Person Settings Mode (edit person)
    ↓ (visualize button)
Person Visualization Mode (planet countdown)
```

### Data Persistence

All data is stored in browser localStorage:

- `lifevis_userData` - User's country, age, life expectancies
- `lifevis_people` - Array of precious people (max 10)
- `lifevis_calculationBasis` - 'life', 'healthy', or 'working'
- `lifevis_displayMode` - 'percentage' or 'time'

**No backend required** - fully client-side application.

---

## Code Conventions

### Naming Conventions

1. **Components**: PascalCase (e.g., `InputSection`, `PersonVisualization`)
2. **Files**: Match component name with `.jsx` extension
3. **Variables/Functions**: camelCase (e.g., `handleVisualize`, `isValidUser`)
4. **Constants**: camelCase for exports in `lifeData.js` (e.g., `lifeExpectancyData`)
5. **CSS Classes**: kebab-case (e.g., `countdown-card`, `settings-modal`)

### Code Style

1. **Functional Components**: Use function declarations, not arrow functions
   ```jsx
   // Good
   function App() { ... }

   // Avoid
   const App = () => { ... }
   ```

2. **Hooks**: Declare at top of component, before any logic
3. **State Organization**: Related state grouped together
4. **Comments**:
   - Bilingual where philosophy is important (EN/JP)
   - Explain "why" not "what"
   - Use `// Philosophy:` prefix for design decisions

5. **Error Handling**: ErrorBoundary in `main.jsx` catches all errors

### JSX Style

1. **Inline Styles**: Used extensively for dynamic styling
   ```jsx
   style={{
     position: 'fixed',
     opacity: isOverviewMode ? 0 : 1,
     transition: 'opacity 0.5s ease'
   }}
   ```

2. **Conditional Rendering**: Use ternary or `&&` appropriately
   ```jsx
   {!isValidUser && isOverviewMode && !isAddingPerson && (
     <button>+</button>
   )}
   ```

3. **Event Handlers**: Inline for simple cases, extracted for complex logic

### File Organization

- **Components**: One component per file, named after component
- **Utilities**: Pure functions in `utils/` directory
- **Assets**: Images in `public/`, imported assets in `src/assets/`
- **Styles**: Global in `index.css`, component-specific inline or in component file

---

## Development Workflow

### Getting Started

```bash
# Install dependencies
npm install

# Start development server (opens at localhost:5173)
npm run dev

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Server

- **Port:** 5173 (strict port, won't try alternatives)
- **Auto-opens:** Browser opens automatically
- **HMR:** Hot Module Replacement enabled via Vite

### Git Workflow

**Important:** This project uses feature branches with specific naming conventions.

1. **Branch Naming**: All feature branches MUST start with `claude/` and end with a session ID
   - Example: `claude/add-feature-ABC123`
   - Push will fail with 403 if naming convention not followed

2. **Development Flow**:
   ```bash
   # Ensure you're on the correct feature branch
   git checkout claude/your-feature-name-SessionID

   # Make changes and commit
   git add .
   git commit -m "Descriptive commit message"

   # Push to remote (use -u for first push)
   git push -u origin claude/your-feature-name-SessionID
   ```

3. **Retry Logic for Network Issues**:
   - For `git push` or `git fetch`: Retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s)
   - Only retry on network failures, not on auth/permission errors

4. **Main Branch**:
   - Protected, deploy-only
   - Pushes to `main` trigger GitHub Actions deployment

### Commit Message Guidelines

- Clear, descriptive messages
- Use prefixes: `feat:`, `fix:`, `docs:`, `refactor:`, `style:`, `test:`
- Examples:
  - `feat: Add person navigation in visualization mode`
  - `fix: Correct Personal Growth calculation to use hoursPerDay`
  - `docs: Update README with latest features`

---

## Key Components

### App.jsx

**Purpose:** Main application orchestrator

**Key Responsibilities:**
- Manages global state (userData, people, modes)
- Handles mode transitions
- Manages localStorage persistence
- Routes between different views

**Key State:**
- `userData`: User's age, country, life expectancies
- `people`: Array of precious people (max 10)
- `isSettingsOpen`, `isDetailPageOpen`: Modal states
- `isOverviewMode`, `selectedPersonId`, `visualizingPersonId`: View states
- `calculationBasis`: 'life' | 'healthy' | 'working'
- `displayMode`: 'percentage' | 'time'

### Scene.jsx

**Purpose:** 3D scene orchestrator using Three.js

**Key Responsibilities:**
- Manages camera positions and transitions
- Renders solar system with Earth and planets
- Handles click events on celestial bodies
- Orchestrates zoom animations

**Props:**
- `isOverviewMode`: Boolean for solar system view
- `visualizingPersonId`: ID of person being visualized
- `people`: Array of people to render as planets
- `onEarthClick`, `onSunClick`, `onPersonClick`: Event handlers

### Visualization.jsx

**Purpose:** User's time visualization with countdown

**Key Features:**
- Countdown timer showing remaining seconds
- Energy tanks for life/healthy/working time
- Settings modal access
- Person navigation

### PersonVisualization.jsx

**Purpose:** Shows time remaining with a specific person

**Key Features:**
- Calculates remaining time based on:
  - Person's age and life expectancy
  - Meeting frequency (times/year)
  - Duration per meeting (hours)
- Navigation to other people
- Display mode toggle (percentage/time)

### PersonSettings.jsx

**Purpose:** Form for adding/editing a person

**Key Fields:**
- Name, age, relationship type
- Meeting frequency (times per year)
- Duration per meeting (hours)
- Life expectancy (auto or custom)

**Actions:**
- Save (add or update person)
- Delete (remove person)
- Visualize (go to person visualization mode)
- Cancel (return to previous view)

### InputSection.jsx

**Purpose:** Initial user data collection

**Fields:**
- Country selection (dropdown with major countries)
- Age input (number)
- Auto-fills life expectancy based on country

### DetailPage.jsx

**Purpose:** Detailed breakdown of remaining time

**Features:**
- Shows all time calculations
- Breakdown by life categories
- Calculation basis selector
- Access to settings

### SolarSystem.jsx

**Purpose:** Renders the 3D solar system

**Features:**
- Orbiting planets for each person
- Realistic planet textures
- Interactive clickable planets
- Responsive sizing based on screen

---

## State Management

### LocalStorage Schema

```javascript
// lifevis_userData
{
  country: "Japan",
  age: 35,
  lifeExpectancy: 84.6,
  healthyLifeExpectancy: 75.0,
  workingAgeLimit: 65
}

// lifevis_people
[
  {
    id: "unique-id-timestamp",
    name: "Mom",
    age: 65,
    customLifeExpectancy: null, // or number
    relationshipType: "parent",
    meetingsPerYear: 24,
    hoursPerMeeting: 4
  }
  // ... up to 10 people
]

// lifevis_calculationBasis
"life" | "healthy" | "working"

// lifevis_displayMode
"percentage" | "time"
```

### State Initialization Pattern

```jsx
const [state, setState] = useState(() => {
  const saved = localStorage.getItem('key');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return defaultValue;
    }
  }
  return defaultValue;
});

useEffect(() => {
  localStorage.setItem('key', JSON.stringify(state));
}, [state]);
```

### Ref Usage

- `userSettingsRef`: Used for scrolling to user settings in modal
- Component refs for Three.js objects in Scene components

---

## Common Tasks

### Adding a New Country

1. Update `lifeExpectancyData` in `src/utils/lifeData.js`
2. Update `healthyLifeExpectancyData`
3. Update `workingAgeLimitData`
4. Update `countryCoordinates` for Earth positioning
5. Update translations if needed

### Adding a New Relationship Type

1. Update `PersonSettings.jsx` relationship options
2. Update any relationship-specific logic
3. Update translations for both EN/JP

### Modifying Time Calculations

**Location:** `src/utils/lifeData.js`

Key functions:
- `calculateLifeStats()`: Main calculation for user's remaining time
- `lifeMoments`: Constants for different life activities

**Important:** Personal Growth calculation uses `hoursPerDay` (not `hoursPerWeek`):
```javascript
breakdown["Personal Growth"] = remainingYears * 365.25 * lifeMoments["Personal Growth"].hoursPerDay;
```

### Adding a New Visualization Mode

1. Add state for new mode in `App.jsx`
2. Update mode transition logic in click handlers
3. Create new component for mode visualization
4. Update Scene.jsx camera positioning
5. Test all transition paths to/from new mode

### Updating Planet Textures

1. Add texture to `public/textures/`
2. Use 2k resolution for consistency (2048x1024)
3. Update SolarSystem.jsx if adding new planet
4. Ensure CORS-compatible image format (jpg/png)

---

## Deployment

### GitHub Pages via GitHub Actions

**Workflow:** `.github/workflows/deploy.yml`

**Trigger:** Push to `main` branch or manual dispatch

**Process:**
1. Checkout repository
2. Setup Node.js 20.19.0
3. Install dependencies (`npm ci`)
4. Build (`npm run build`)
5. Upload dist folder as Pages artifact
6. Deploy to GitHub Pages

**Build Output:** `dist/` directory (gitignored)

**Custom Domain:** Configured via `CNAME` file (`letmeknow.life`)

### Build Configuration

**vite.config.js:**
- `base: '/'` - Root path deployment
- `outDir: 'dist'` - Output directory
- `sourcemap: false` - No source maps in production
- `cssCodeSplit: true` - Split CSS for performance
- `chunkSizeWarningLimit: 1000` - Large chunk warning at 1MB

### Manual Deployment

```bash
# Build locally
npm run build

# Preview build
npm run preview

# Deploy (if needed manually)
# - Push to main branch
# - Or use GitHub Actions manual trigger
```

---

## Important Considerations

### Performance

1. **Three.js Performance**:
   - Planet textures are 2k (good balance of quality/performance)
   - Particle systems limited for performance
   - Use `useMemo` for expensive calculations in 3D components

2. **React Performance**:
   - Avoid unnecessary re-renders in 3D components
   - Use `useCallback` for event handlers passed to children
   - LocalStorage reads on mount only, writes on change

3. **Asset Loading**:
   - Textures load asynchronously
   - Show loading states where appropriate
   - Use Suspense boundaries if needed

### Browser Compatibility

- **Target:** Modern browsers (ES2020+)
- **Three.js:** Requires WebGL support
- **LocalStorage:** Required for persistence
- **Mobile:** Touch events supported, but desktop experience preferred

### Accessibility

- **Current State:** Limited accessibility support
- **Future Improvements Needed:**
  - Keyboard navigation for 3D scene
  - Screen reader support
  - ARIA labels for interactive elements
  - Focus management for modals

### Internationalization

**Two Languages Supported:**
- Japanese (default for Japan country)
- English (default for others)

**Translation System:**
- Centralized in `lifeData.js` - `translations` object
- Component-level language detection via `isJapan` prop
- Inline translations for UI strings

**Adding New Language:**
1. Add language key to `translations` object
2. Translate all strings
3. Add language detection logic
4. Update components to use new language

### Data Privacy

**No Backend/Tracking:**
- All data stored locally in browser
- No analytics or tracking
- No user accounts or authentication
- Users can clear data by clearing localStorage

**Sharing:**
- Screenshot sharing via html2canvas
- No data sent to servers
- Image generated client-side

### Error Handling

**ErrorBoundary:**
- Top-level error boundary in `main.jsx`
- Catches all React errors
- Shows fallback UI with reload button
- Logs errors to console

**Best Practices:**
- Validate user input
- Handle localStorage errors gracefully
- Check for required data before rendering
- Provide fallback values

### Testing

**Current State:** No automated tests

**Recommended Testing:**
- Manual testing of all mode transitions
- Test on multiple browsers
- Test with various data inputs
- Test localStorage persistence
- Test 3D performance on different devices

**Future Improvements:**
- Unit tests for calculations in `lifeData.js`
- Integration tests for mode transitions
- E2E tests for critical user flows
- Visual regression tests for 3D scenes

---

## Philosophy Reminders for AI Assistants

When working on this project, keep these principles in mind:

1. **Liberation over Fear**: Features should give courage and liberation, never instill fear or panic

2. **Data-Based Truth**: Messages and calculations should be mathematical facts, not vague spiritual content

3. **Simplicity**: This is about subtraction, not addition. Don't over-engineer features

4. **Privacy First**: No tracking, no servers, no accounts. User data stays local.

5. **Bilingual Respect**: Maintain quality in both Japanese and English. The philosophy is deeply rooted in both cultures.

6. **Gentle Design**: As users visualize time, they should become gentler. Design should reflect this gentleness.

7. **Personal Freedom**: Users should have complete freedom in how they use their universe (who they place, where, etc.)

---

## Quick Reference

### Key Files to Know

- `src/App.jsx` - Application state and routing
- `src/components/Scene.jsx` - 3D scene management
- `src/utils/lifeData.js` - All data and calculations
- `vite.config.js` - Build configuration
- `.github/workflows/deploy.yml` - Deployment pipeline

### Important Constants

- **Max People:** 10
- **Default Life Expectancy:** 73.2 years (Global)
- **Calculation Bases:** life | healthy | working
- **Display Modes:** percentage | time
- **Dev Port:** 5173

### Useful Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # Check code quality
npm run preview    # Preview prod build
```

### Common Bugs to Watch For

1. **State Timing Issues**: Mode transitions can cause race conditions
2. **LocalStorage Parsing**: Always wrap in try-catch
3. **Three.js Memory Leaks**: Dispose of geometries and materials
4. **Calculation Edge Cases**: Age > life expectancy, negative values
5. **Mobile Touch Events**: May need special handling vs mouse events

---

## Resources

- **Concept Doc:** See [CONCEPT.md](./CONCEPT.md) for full philosophy
- **User Guide:** See [README.md](./README.md) for user-facing docs
- **Three.js Docs:** https://threejs.org/docs/
- **React Three Fiber:** https://docs.pmnd.rs/react-three-fiber
- **Vite Guide:** https://vitejs.dev/guide/

---

## Contact & Contributions

This project is open source (MIT License). Contributions welcome but:

1. **Understand the Philosophy First**: Read CONCEPT.md thoroughly
2. **Respect the Vision**: This is a personal project with specific goals
3. **Test Thoroughly**: Especially mode transitions and 3D interactions
4. **Maintain Quality**: Both English and Japanese must be high quality

---

*This guide is maintained for AI assistants (like Claude) working on this codebase. Keep it updated as the project evolves.*
