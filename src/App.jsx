import React, { useState, useEffect, useRef } from 'react'
import InputSection from './components/InputSection'
import Visualization, { UserSettings, PeopleSettings } from './components/Visualization'
import DetailPage from './components/DetailPage'
import Earth3D from './components/Earth3D'
import DigitalHourglass from './components/DigitalHourglass'
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
  };

  return (
    <div className="app-container">
      {/* 3D Backgrounds */}
      {!isValidUser ? (
        <Earth3D targetCountry={currentCountry} />
      ) : (
        <DigitalHourglass
          remainingPercentage={userData ? ((userData.lifeExpectancy - userData.age) / userData.lifeExpectancy * 100) : 50}
          livedSeconds={userData ? Math.floor(userData.age * 365.25 * 24 * 60 * 60) : 0}
          remainingSeconds={userData ? Math.floor((userData.lifeExpectancy - userData.age) * 365.25 * 24 * 60 * 60) : 0}
        />
      )}

      <header className="container fade-in app-header">
        {isValidUser && (
          <button 
            className="header-settings-btn"
            onClick={() => {
              setEditingPersonId(null);
              setIsSettingsOpen(true);
            }}
            aria-label="Settings"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        )}
        <div style={{ width: '100%' }}>
        </div>
      </header>

      <main className="container" style={{ position: 'relative', zIndex: 2 }}>
        {!isValidUser ? (
          <InputSection
            onVisualize={handleVisualize}
            onCountryChange={setCurrentCountry}
          />
        ) : isDetailPageOpen ? (
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
        ) : (
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
          />
        )}
      </main>

      {/* Settings Modal - Outside main container */}
      {isSettingsOpen && isValidUser && (
        <>
          <div className="settings-overlay" onClick={() => {
            setIsSettingsOpen(false);
            setEditingPersonId(null);
          }}></div>
          <div className="settings-modal">
            <div className="settings-container">
              <div className="settings-header">
                <h2 className="settings-title">設定</h2>
                <button className="close-btn" onClick={() => {
                  setIsSettingsOpen(false);
                  setEditingPersonId(null);
                }}>×</button>
              </div>
              <div className="settings-content">
                <div ref={userSettingsRef}>
                  <UserSettings
                    lifeExpectancy={userData.lifeExpectancy || lifeExpectancyData[userData.country] || lifeExpectancyData['Global']}
                    healthyLifeExpectancy={userData.healthyLifeExpectancy || healthyLifeExpectancyData[userData.country] || healthyLifeExpectancyData['Global']}
                    workingAgeLimit={userData.workingAgeLimit || workingAgeLimitData[userData.country] || workingAgeLimitData['Global']}
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
                
                {/* Detail Page Link */}
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
