import React, { useState, useEffect, useReducer, useRef } from 'react'
import InputSection from './components/InputSection'
import Visualization, { UserSettings, PeopleSettings } from './components/Visualization'
import DetailPage from './components/DetailPage'
import Scene from './components/Scene'
import PersonSettings from './components/PersonSettings'
import PersonVisualization from './components/PersonVisualization'
import EmptyUniverse from './components/EmptyUniverse'
import { lifeExpectancyData, healthyLifeExpectancyData, workingAgeLimitData, calculateLifeStats } from './utils/lifeData'
import { useT } from './i18n'
import { viewReducer, initialViewState } from './state/appView'

function App() {
  // ─── data state ──────────────────────────────────────────────────
  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem('lifevis_userData');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.lifeExpectancy && parsed.country) {
        parsed.lifeExpectancy = lifeExpectancyData[parsed.country] || lifeExpectancyData['Global'];
      }
      if (!parsed.healthyLifeExpectancy && parsed.country) {
        parsed.healthyLifeExpectancy = healthyLifeExpectancyData[parsed.country] || healthyLifeExpectancyData['Global'];
      }
      if (!parsed.workingAgeLimit && parsed.country) {
        parsed.workingAgeLimit = workingAgeLimitData[parsed.country] || workingAgeLimitData['Global'];
      }
      return parsed;
    }
    return null;
  });
  const [currentCountry, setCurrentCountry] = useState('Japan');
  const [people, setPeopleRaw] = useState(() => {
    const saved = localStorage.getItem('lifevis_people');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Schema v1 → v2 migration: ensure every person has relationship + isMentor.
        return parsed.map((p) => ({ relationship: 'other', isMentor: false, ...p }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Wrapper enforcing the "only one mentor at a time" invariant.
  const setPeople = (next) => {
    const arr = typeof next === 'function' ? next(people) : next;
    const prevMentorIds = new Set(people.filter((p) => p.isMentor).map((p) => p.id));
    const newMentor = arr.find((p) => p.isMentor && !prevMentorIds.has(p.id));
    let normalized = arr;
    if (newMentor) {
      normalized = arr.map((p) =>
        p.id === newMentor.id ? p : (p.isMentor ? { ...p, isMentor: false } : p)
      );
    } else {
      const mentors = arr.filter((p) => p.isMentor);
      if (mentors.length > 1) {
        const keepId = mentors[mentors.length - 1].id;
        normalized = arr.map((p) =>
          p.isMentor && p.id !== keepId ? { ...p, isMentor: false } : p
        );
      }
    }
    setPeopleRaw(normalized);
  };

  const [calculationBasis, setCalculationBasis] = useState(() =>
    localStorage.getItem('lifevis_calculationBasis') || 'life'
  );
  const [displayMode, setDisplayMode] = useState(() =>
    localStorage.getItem('lifevis_displayMode') || 'percentage'
  );
  const [particleDropCallback, setParticleDropCallback] = useState(null);
  const [personDisplayMode, setPersonDisplayMode] = useState('percentage');

  // ─── view state (consolidated reducer) ───────────────────────────
  const [view, dispatch] = useReducer(viewReducer, initialViewState);
  const userSettingsRef = useRef(null);

  // ─── derived ─────────────────────────────────────────────────────
  const isValidUser = !!(userData && userData.country && (userData.age !== undefined && userData.age !== null));
  const tt = useT(userData?.country || currentCountry);

  // ─── persistence ─────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('lifevis_people', JSON.stringify(people));
  }, [people]);
  useEffect(() => {
    localStorage.setItem('lifevis_calculationBasis', calculationBasis);
  }, [calculationBasis]);
  useEffect(() => {
    localStorage.setItem('lifevis_displayMode', displayMode);
  }, [displayMode]);
  useEffect(() => {
    if (userData) localStorage.setItem('lifevis_userData', JSON.stringify(userData));
    else localStorage.removeItem('lifevis_userData');
  }, [userData]);

  // ─── handlers ────────────────────────────────────────────────────
  const handleVisualize = (country, age) => {
    const lifeExpectancy = lifeExpectancyData[country] || lifeExpectancyData['Global'];
    const healthyLifeExpectancy = healthyLifeExpectancyData[country] || healthyLifeExpectancyData['Global'];
    const workingAgeLimit = workingAgeLimitData[country] || workingAgeLimitData['Global'];
    setUserData({ country, age, lifeExpectancy, healthyLifeExpectancy, workingAgeLimit });
  };

  const handleUpdateUserSettings = (updates) => {
    setUserData((prev) => ({ ...prev, ...updates }));
  };

  const handleReset = () => {
    setUserData(null);
    dispatch({ type: 'RESET' });
  };

  const handleEarthClick = () => {
    // EARTH_CLICK from countdown mode also flips userData to null so the
    // settings/input UI takes over. The reducer doesn't own userData.
    if (view.visualizingPersonId || isValidUser) {
      setUserData(null);
    }
    dispatch({ type: 'EARTH_CLICK', isValidUser });
  };

  const handleSunClick = () => {
    dispatch({ type: 'SUN_CLICK', isValidUser });
  };

  const handlePersonClick = (personId) => {
    if (view.visualizingPersonId || isValidUser) {
      setUserData(null);
    }
    dispatch({ type: 'PERSON_CLICK', personId, isValidUser });
  };

  const navigateTo = (direction) => {
    const items = [null, ...people.map((p) => p.id)];
    const currentIndex = items.indexOf(view.visualizingPersonId);
    const nextIndex = direction === 'next'
      ? (currentIndex + 1) % items.length
      : (currentIndex - 1 + items.length) % items.length;
    dispatch({ type: 'VISUALIZE', personId: items[nextIndex] });
  };

  return (
    <div className="app-container">
      <Scene
        isVisualizing={(isValidUser && !view.isSettingsOpen) || view.visualizingPersonId}
        isSettingsOpen={view.isSettingsOpen}
        isOverviewMode={view.isOverviewMode}
        calculationBasis={calculationBasis}
        targetCountry={userData ? userData.country : currentCountry}
        remainingPercentage={userData ? ((userData.lifeExpectancy - userData.age) / userData.lifeExpectancy * 100) : 50}
        onParticleDrop={particleDropCallback}
        onEarthClick={handleEarthClick}
        onSunClick={handleSunClick}
        visualizingPersonId={view.visualizingPersonId}
        isEarthVisualized={isValidUser && !view.visualizingPersonId}
        onPersonClick={handlePersonClick}
        selectedPersonId={view.selectedPersonId}
        people={people}
        userAge={userData ? userData.age : 44}
        userCountry={userData ? userData.country : currentCountry}
        remainingYears={userData ? (() => {
          const stats = calculateLifeStats(userData.country, userData.age, userData.lifeExpectancy);
          return stats.remainingYears;
        })() : 40}
        remainingSeconds={userData ? (() => {
          const stats = calculateLifeStats(userData.country, userData.age, userData.lifeExpectancy);
          return stats.remainingSeconds || 0;
        })() : 0}
        livedSeconds={userData ? (() => {
          return userData.age * 365.25 * 24 * 60 * 60;
        })() : 0}
      />

      <header className="container fade-in app-header">
        <div style={{ width: '100%' }}></div>
      </header>

      {isValidUser && !view.isSettingsOpen && !view.isDetailPageOpen && people.length === 0 && (
        <EmptyUniverse userCountry={userData.country} />
      )}

      {!isValidUser && view.isOverviewMode && !view.isAddingPerson && !view.selectedPersonId && (
        <button
          onClick={() => dispatch({ type: 'START_ADD_PERSON' })}
          aria-label={tt('person.title.add')}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            color: 'white',
            fontSize: '2rem',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 6px 25px rgba(59, 130, 246, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.4)';
          }}
        >
          +
        </button>
      )}

      <main className="container" style={{ position: 'relative', zIndex: 2, pointerEvents: 'none' }}>
        {!isValidUser && view.isAddingPerson ? (
          <div style={overlayStyle}>
            <PersonSettings
              person={null}
              onSave={(newPerson) => {
                setPeople([...people, newPerson]);
                dispatch({ type: 'FINISH_ADD_PERSON' });
              }}
              onCancel={() => dispatch({ type: 'CANCEL_ADD_PERSON' })}
              isJapan={currentCountry === 'Japan'}
              userCountry={userData ? userData.country : currentCountry}
              userAge={userData?.age}
              calculationBasis={calculationBasis}
            />
          </div>
        ) : view.visualizingPersonId ? (
          <div style={{ pointerEvents: 'none', width: '100%', height: '100%' }}>
            <PersonVisualization
              key={view.visualizingPersonId}
              person={people.find((p) => p.id === view.visualizingPersonId)}
              displayMode={personDisplayMode}
              onDisplayModeChange={setPersonDisplayMode}
              isJapan={currentCountry === 'Japan'}
              userCountry={userData ? userData.country : currentCountry}
              userAge={userData?.age ?? 44}
              onNavigate={navigateTo}
            />
          </div>
        ) : !isValidUser && view.selectedPersonId ? (
          <div style={overlayStyle}>
            <PersonSettings
              person={people.find((p) => p.id === view.selectedPersonId)}
              onSave={(updatedPerson) => {
                setPeople(people.map((p) => (p.id === updatedPerson.id ? updatedPerson : p)));
                dispatch({ type: 'DESELECT_PERSON' });
              }}
              onDelete={(id) => {
                setPeople(people.filter((p) => p.id !== id));
                dispatch({ type: 'DESELECT_PERSON' });
              }}
              onCancel={() => dispatch({ type: 'DESELECT_PERSON' })}
              onVisualize={(personId) => {
                dispatch({ type: 'VISUALIZE', personId });
                dispatch({ type: 'DESELECT_PERSON' });
              }}
              isJapan={currentCountry === 'Japan'}
              userCountry={userData ? userData.country : currentCountry}
              userAge={userData?.age}
              calculationBasis={calculationBasis}
            />
          </div>
        ) : !isValidUser ? (
          <div style={{
            ...overlayStyle,
            opacity: view.isOverviewMode ? 0 : 1,
            transition: 'opacity 0.5s ease',
            visibility: view.isOverviewMode ? 'hidden' : 'visible',
            zIndex: 90
          }}>
            <InputSection
              onVisualize={handleVisualize}
              onCountryChange={setCurrentCountry}
            />
          </div>
        ) : view.isDetailPageOpen ? (
          <div style={{ pointerEvents: 'auto', height: '100%' }}>
            <DetailPage
              country={userData.country}
              age={userData.age}
              lifeExpectancy={userData.lifeExpectancy}
              healthyLifeExpectancy={userData.healthyLifeExpectancy}
              workingAgeLimit={userData.workingAgeLimit}
              calculationBasis={calculationBasis}
              onCalculationBasisChange={setCalculationBasis}
              onReset={() => {
                dispatch({ type: 'CLOSE_DETAIL' });
                handleReset();
              }}
              onOpenSettingsWithPerson={(personId) => {
                dispatch({
                  type: 'OPEN_SETTINGS',
                  editingPersonId: personId === 'user-settings' ? null : personId
                });
                dispatch({ type: 'CLOSE_DETAIL' });
              }}
              people={people}
              displayMode={displayMode}
              onDisplayModeChange={setDisplayMode}
              onBack={() => dispatch({ type: 'CLOSE_DETAIL' })}
            />
          </div>
        ) : (
          <div style={{ pointerEvents: 'none', width: '100%', height: '100%' }}>
            <Visualization
              country={userData.country}
              age={userData.age}
              lifeExpectancy={userData.lifeExpectancy}
              healthyLifeExpectancy={userData.healthyLifeExpectancy}
              workingAgeLimit={userData.workingAgeLimit}
              calculationBasis={calculationBasis}
              onCalculationBasisChange={setCalculationBasis}
              onReset={handleReset}
              isSettingsOpen={view.isSettingsOpen}
              onCloseSettings={() => dispatch({ type: 'CLOSE_SETTINGS' })}
              editingPersonId={view.editingPersonId}
              onOpenSettingsWithPerson={(personId) => {
                dispatch({
                  type: 'OPEN_SETTINGS',
                  editingPersonId: personId === 'user-settings' ? null : personId
                });
              }}
              onUpdateUserSettings={handleUpdateUserSettings}
              people={people}
              setPeople={setPeople}
              stats={isValidUser ? calculateLifeStats(userData.country, userData.age, userData.lifeExpectancy) : null}
              userSettingsRef={userSettingsRef}
              onParticleDrop={(callback) => setParticleDropCallback(() => callback)}
              onNavigate={navigateTo}
            />
          </div>
        )}
      </main>

      {view.isSettingsOpen && isValidUser && (
        <>
          <div className="settings-overlay" onClick={() => dispatch({ type: 'CLOSE_SETTINGS' })}></div>
          <div className="settings-modal">
            <div className="settings-container">
              <div className="settings-header">
                <h2 className="settings-title">{tt('common.settings')}</h2>
                <button
                  className="close-btn"
                  aria-label={tt('common.close')}
                  onClick={() => dispatch({ type: 'CLOSE_SETTINGS' })}
                >×</button>
              </div>
              <div className="settings-content">
                <div ref={userSettingsRef}>
                  <UserSettings
                    lifeExpectancy={userData.lifeExpectancy || lifeExpectancyData[userData.country] || lifeExpectancyData['Global']}
                    healthyLifeExpectancy={userData.country === 'Japan' ? healthyLifeExpectancyData['Japan'] : healthyLifeExpectancyData['Global']}
                    workingAgeLimit={userData.country === 'Japan' ? workingAgeLimitData['Japan'] : workingAgeLimitData['Global']}
                    calculationBasis={calculationBasis}
                    onCalculationBasisChange={setCalculationBasis}
                    onUpdate={handleUpdateUserSettings}
                  />
                </div>
                <PeopleSettings
                  people={people}
                  setPeople={setPeople}
                  userAge={userData.age}
                  userCountry={userData.country}
                  remainingYears={(() => {
                    const stats = calculateLifeStats(userData.country, userData.age, userData.lifeExpectancy);
                    return stats.remainingYears;
                  })()}
                  editingPersonId={view.editingPersonId}
                  onEditComplete={() => dispatch({ type: 'CLOSE_SETTINGS' })}
                />
                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <button
                    onClick={() => dispatch({ type: 'OPEN_DETAIL' })}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      color: 'var(--color-text-primary)',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.15)'; }}
                    onMouseLeave={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.1)'; }}
                  >
                    {tt('common.viewDetail')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const overlayStyle = {
  pointerEvents: 'auto',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
  overflowY: 'auto',
  overflowX: 'hidden',
  WebkitOverflowScrolling: 'touch',
  zIndex: 100
};

export default App
