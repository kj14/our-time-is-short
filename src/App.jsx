import React, { useState, useEffect, useRef } from 'react'
import InputSection from './components/InputSection'
import Visualization, { UserSettings, PeopleSettings } from './components/Visualization'
import DetailPage from './components/DetailPage'
import Scene from './components/Scene'
import PersonSettings from './components/PersonSettings'
import PersonVisualization from './components/PersonVisualization'
import { lifeExpectancyData, healthyLifeExpectancyData, workingAgeLimitData, calculateLifeStats } from './utils/lifeData'

function App() {
  // Load userData from localStorage if available
  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem('lifevis_userData');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Set default values if not present
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDetailPageOpen, setIsDetailPageOpen] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState(null);
  const [people, setPeople] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('lifevis_people');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [calculationBasis, setCalculationBasis] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('lifevis_calculationBasis');
    return saved || 'life'; // 'life', 'healthy', 'working'
  });
  const [displayMode, setDisplayMode] = useState(() => {
    const saved = localStorage.getItem('lifevis_displayMode');
    return saved || 'percentage';
  });
  const [particleDropCallback, setParticleDropCallback] = useState(null);
  const [isOverviewMode, setIsOverviewMode] = useState(false); // True = 俯瞰視点, False = 地球ズーム
  const [isAddingPerson, setIsAddingPerson] = useState(false); // True when adding new person
  const [selectedPersonId, setSelectedPersonId] = useState(null); // ID of person being edited (star zoomed)
  const [visualizingPersonId, setVisualizingPersonId] = useState(null); // ID of person whose time is being visualized
  const [personDisplayMode, setPersonDisplayMode] = useState('time'); // 'time' or 'percentage'
  const userSettingsRef = useRef(null);

  // Save to localStorage whenever people changes
  useEffect(() => {
    localStorage.setItem('lifevis_people', JSON.stringify(people));
  }, [people]);

  // Save calculation basis to localStorage
  useEffect(() => {
    localStorage.setItem('lifevis_calculationBasis', calculationBasis);
  }, [calculationBasis]);

  // Validate userData
  const isValidUser = userData && userData.country && (userData.age !== undefined && userData.age !== null);

  // Save userData to localStorage whenever it changes
  useEffect(() => {
    if (userData) {
      localStorage.setItem('lifevis_userData', JSON.stringify(userData));
    } else {
      localStorage.removeItem('lifevis_userData');
    }
  }, [userData]);

    const handleVisualize = (country, age) => {
    // Philosophy: Stop postponing life. Start visualizing it.
    // 思想：人生を後回しにするのをやめる。可視化から始める。
    const lifeExpectancy = lifeExpectancyData[country] || lifeExpectancyData['Global'];
    const healthyLifeExpectancy = healthyLifeExpectancyData[country] || healthyLifeExpectancyData['Global'];
    const workingAgeLimit = workingAgeLimitData[country] || workingAgeLimitData['Global'];
    setUserData({ 
      country, 
      age,
      lifeExpectancy,
      healthyLifeExpectancy,
      workingAgeLimit
    });
  };

  const handleUpdateUserSettings = (updates) => {
    setUserData(prev => ({ ...prev, ...updates }));
  };

  const handleReset = () => {
    setUserData(null);
    setIsDetailPageOpen(false);
    setIsSettingsOpen(false);
    setIsOverviewMode(false); // Always start in zoom mode (settings), not overview
  };

  const handleEarthClick = () => {
    if (isValidUser) {
      // From countdown mode: go back to You's settings mode
      setSelectedPersonId(null);
      handleReset();
    } else if (selectedPersonId) {
      // From star's settings mode: go to overview mode
      setSelectedPersonId(null);
      setIsOverviewMode(true);
    } else if (isOverviewMode) {
      // From overview mode: go to You's settings mode
      setIsOverviewMode(false);
    } else {
      // From You's settings mode: go to overview mode
      setIsOverviewMode(true);
    }
  };

  const handleSunClick = () => {
    // Sun is the settings screen entry point (gear icon settings modal)
    setIsEarthZoomed(false);
    if (isValidUser) {
      setEditingPersonId(null);
      setIsSettingsOpen(true);
    }
  };

  return (
    <div className="app-container">
      {/* Integrated 3D Scene */}
      <Scene 
        isVisualizing={isValidUser && !isSettingsOpen}
        isSettingsOpen={isSettingsOpen}
        isOverviewMode={isOverviewMode}
        targetCountry={userData ? userData.country : currentCountry}
        remainingPercentage={userData ? ((userData.lifeExpectancy - userData.age) / userData.lifeExpectancy * 100) : 50}
        onParticleDrop={particleDropCallback}
        onEarthClick={handleEarthClick}
        onSunClick={handleSunClick}
        onPersonClick={(personId) => {
          if (isValidUser) {
            // From countdown mode: go to that star's settings mode
            setSelectedPersonId(personId);
            handleReset(); // Go back to settings screen
          } else if (selectedPersonId === personId) {
            // Tapping same star in settings mode: go to overview
            setSelectedPersonId(null);
            setIsOverviewMode(true);
          } else if (selectedPersonId) {
            // From another star's settings mode: go to overview first
            setSelectedPersonId(null);
            setIsOverviewMode(true);
          } else if (isOverviewMode) {
            // From overview mode: zoom to that star's settings
            setSelectedPersonId(personId);
            setIsOverviewMode(false);
          } else {
            // From You's settings mode: go to overview
            setIsOverviewMode(true);
          }
        }}
        selectedPersonId={selectedPersonId}
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
          const lifeExpectancy = userData.lifeExpectancy || lifeExpectancyData[userData.country] || lifeExpectancyData['Global'];
          const livedYears = userData.age;
          return livedYears * 365.25 * 24 * 60 * 60;
        })() : 0}
      />

      <header className="container fade-in app-header">
        <div style={{ width: '100%' }}>
        </div>
      </header>

      {/* Add Person Button - shown in overview mode */}
      {!isValidUser && isOverviewMode && !isAddingPerson && !selectedPersonId && (
        <button
          onClick={() => setIsAddingPerson(true)}
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
        {/* Adding new person */}
        {!isValidUser && isAddingPerson ? (
          <div style={{ 
            pointerEvents: 'auto', 
            height: '100vh',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            <PersonSettings
              person={null}
              onSave={(newPerson) => {
                setPeople([...people, newPerson]);
                setIsAddingPerson(false);
              }}
              onCancel={() => setIsAddingPerson(false)}
              isJapan={currentCountry === 'Japan'}
            />
          </div>
        ) : !isValidUser && visualizingPersonId ? (
          // Person visualization mode - show time together
          <div style={{ pointerEvents: 'auto' }}>
            <PersonVisualization
              person={people.find(p => p.id === visualizingPersonId)}
              displayMode={personDisplayMode}
              onDisplayModeChange={setPersonDisplayMode}
              onBack={() => {
                setVisualizingPersonId(null);
                setSelectedPersonId(visualizingPersonId);
              }}
              isJapan={currentCountry === 'Japan'}
            />
          </div>
        ) : !isValidUser && selectedPersonId ? (
          <div style={{ 
            pointerEvents: 'auto', 
            height: '100vh',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            <PersonSettings
              person={people.find(p => p.id === selectedPersonId)}
              onSave={(updatedPerson) => {
                setPeople(people.map(p => p.id === updatedPerson.id ? updatedPerson : p));
                setSelectedPersonId(null);
              }}
              onDelete={(id) => {
                setPeople(people.filter(p => p.id !== id));
                setSelectedPersonId(null);
              }}
              onCancel={() => setSelectedPersonId(null)}
              onVisualize={(personId) => {
                setVisualizingPersonId(personId);
                setSelectedPersonId(null);
              }}
              isJapan={currentCountry === 'Japan'}
            />
          </div>
        ) : !isValidUser ? (
          <div style={{ 
            pointerEvents: 'none',
            opacity: isOverviewMode ? 0 : 1,
            transition: 'opacity 0.5s ease',
            visibility: isOverviewMode ? 'hidden' : 'visible'
          }}>
            <InputSection
              onVisualize={handleVisualize}
              onCountryChange={setCurrentCountry}
            />
          </div>
        ) : isDetailPageOpen ? (
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
                setIsDetailPageOpen(false);
                handleReset();
              }}
              onOpenSettingsWithPerson={(personId) => {
                if (personId === 'user-settings') {
                  setEditingPersonId(null);
                } else {
                  setEditingPersonId(personId);
                }
                setIsDetailPageOpen(false);
                setIsSettingsOpen(true);
              }}
              people={people}
              displayMode={displayMode}
              onDisplayModeChange={setDisplayMode}
              onBack={() => setIsDetailPageOpen(false)}
            />
          </div>
        ) : (
          <div style={{ pointerEvents: 'none', width: '100%', height: '100%' }}>
             {/* Visualization wrapper is pointer-events: none to allow Earth clicks through.
                 Interactive elements like countdown-card have pointer-events: auto set in CSS. */}
            <Visualization
              country={userData.country}
              age={userData.age}
              lifeExpectancy={userData.lifeExpectancy}
              healthyLifeExpectancy={userData.healthyLifeExpectancy}
              workingAgeLimit={userData.workingAgeLimit}
              calculationBasis={calculationBasis}
              onCalculationBasisChange={setCalculationBasis}
              onReset={handleReset}
              isSettingsOpen={isSettingsOpen}
              onCloseSettings={() => {
                setIsSettingsOpen(false);
                setIsEarthZoomed(false);
                setEditingPersonId(null);
              }}
              editingPersonId={editingPersonId}
              onOpenSettingsWithPerson={(personId) => {
                if (personId === 'user-settings') {
                  setEditingPersonId(null);
                } else {
                  setEditingPersonId(personId);
                }
                setIsSettingsOpen(true);
              }}
              onUpdateUserSettings={handleUpdateUserSettings}
              people={people}
              setPeople={setPeople}
              stats={isValidUser ? calculateLifeStats(userData.country, userData.age, userData.lifeExpectancy) : null}
              userSettingsRef={userSettingsRef}
              onParticleDrop={(callback) => setParticleDropCallback(() => callback)}
            />
          </div>
        )}
      </main>

      {/* Settings Modal - Outside main container */}
      {isSettingsOpen && isValidUser && (
        <>
          <div className="settings-overlay" onClick={() => {
            setIsSettingsOpen(false);
            setIsEarthZoomed(false);
            setEditingPersonId(null);
          }}></div>
          <div className="settings-modal">
            <div className="settings-container">
              <div className="settings-header">
                <h2 className="settings-title">設定</h2>
                <button className="close-btn" onClick={() => {
                  setIsSettingsOpen(false);
                  setIsEarthZoomed(false);
                  setEditingPersonId(null);
                }}>×</button>
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
                  editingPersonId={editingPersonId}
                  onEditComplete={() => {
                    setIsSettingsOpen(false);
                    setEditingPersonId(null);
                  }}
                />
                <div style={{ 
                  marginTop: '2rem', 
                  paddingTop: '2rem', 
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)' 
                }}>
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setIsDetailPageOpen(true);
                    }}
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
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    {userData.country === 'Japan' ? '詳細ページを見る' : 'View Detail Page'}
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

export default App