import React, { useEffect, useState, useRef, useMemo } from 'react';
import { calculateLifeStats, translations, lifeExpectancyData, healthyLifeExpectancyData, workingAgeLimitData } from '../utils/lifeData';
import { calculateAge, calculateHoursWithPerson } from '../utils/calculations';
import { useT } from '../i18n';
import { getConditionText } from './visualization/helpers';
import TimeUnit from './visualization/TimeUnit';
import UserSettings from './visualization/UserSettings';
import PeopleSettings from './visualization/PeopleSettings';

const Visualization = ({ country, age, lifeExpectancy: customLifeExpectancy, healthyLifeExpectancy: customHealthyLifeExpectancy, workingAgeLimit: customWorkingAgeLimit, calculationBasis, onCalculationBasisChange, onReset, isSettingsOpen, onCloseSettings, editingPersonId, onOpenSettingsWithPerson, onUpdateUserSettings, people, setPeople, stats, userSettingsRef, onParticleDrop, onSettingsClick, onNavigate }) => {
    const [visible, setVisible] = useState(false);
    const [calculatedStats, setCalculatedStats] = useState(null);

    const visualizationRef = useRef(null);
    const particleDropHandlerRef = useRef(null);

    const t = translations[country] || translations['default'];
    const tt = useT(country);
    
    // Register particle drop handler with parent
    useEffect(() => {
        if (onParticleDrop) {
            onParticleDrop(() => {
                if (particleDropHandlerRef.current) {
                    particleDropHandlerRef.current();
                }
            });
        }
    }, [onParticleDrop]);

    // Philosophy: Time is invisible, so we tend to postpone living.
    // Visualization turns vague "someday" into concrete "remaining time".
    // 人は「見えない時間」を後回しにする。可視化することで、行動が生まれる。
    
    // Handle opening settings and scrolling to user settings
    const handleOpenUserSettings = () => {
        if (!isSettingsOpen && onOpenSettingsWithPerson) {
            // Open settings modal - pass a special marker to indicate we want user settings
            onOpenSettingsWithPerson('user-settings');
        }
    };

    useEffect(() => {
        if (country && (age !== null && age !== undefined)) {
            const lifeExpectancy = customLifeExpectancy || lifeExpectancyData[country] || lifeExpectancyData['Global'];
            const calculated = calculateLifeStats(country, age, lifeExpectancy);
            setCalculatedStats(calculated);
            setTimeout(() => setVisible(true), 50);
        }
    }, [country, age, customLifeExpectancy]);

    const displayStats = stats || calculatedStats;

    const baseLifeExpectancy = customLifeExpectancy || lifeExpectancyData[country] || lifeExpectancyData['Global'];
    const baseHealthyLifeExpectancy = customHealthyLifeExpectancy || healthyLifeExpectancyData[country] || healthyLifeExpectancyData['Global'];
    const baseWorkingAgeLimit = customWorkingAgeLimit || workingAgeLimitData[country] || workingAgeLimitData['Global'];

    const basisRemainingYears = {
        life: Math.max(0, baseLifeExpectancy - age),
        healthy: Math.max(0, baseHealthyLifeExpectancy - age),
        working: Math.max(0, baseWorkingAgeLimit - age)
    };
    const getThemeColor = () => {
        if (!displayStats) return '#06b6d4';
        if (displayStats.remainingYears < 10) return '#ef4444';
        if (displayStats.remainingYears < 30) return '#eab308';
        return '#06b6d4';
    };
    const themeColor = getThemeColor();

    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!displayStats || displayStats.remainingSeconds === undefined || displayStats.remainingSeconds === null) {
            setTimeLeft(null);
            return;
        }
        
        // Set initial value immediately
        const remainingSeconds = displayStats.remainingSeconds;
        const remainingMs = remainingSeconds * 1000;
        setTimeLeft(remainingMs);
        
        const now = new Date();
        const endDate = new Date(now.getTime() + remainingMs);
        
        const timer = setInterval(() => {
            const current = new Date();
            const diff = endDate - current;
            if (diff <= 0) {
                setTimeLeft(0);
                clearInterval(timer);
            } else {
                setTimeLeft(diff);
            }
        }, 10);
        
        return () => clearInterval(timer);
    }, [displayStats?.remainingSeconds]);

    // Create particle drop handler (no animation needed)
    const handleParticleDrop = () => {
        // No animation - just a placeholder for particle drop callback
    };
    
    // Store particle drop handler in ref
    useEffect(() => {
        particleDropHandlerRef.current = handleParticleDrop;
    }, [timeLeft]);

    const getTimeComponents = (ms) => {
        if (ms === null) return null;
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        const milliseconds = Math.floor((ms % 1000) / 10);
        return { days, hours, minutes, seconds, milliseconds };
    };

    const timeComponents = getTimeComponents(timeLeft);
    const pad = (n) => n.toString().padStart(2, '0');


    if (!displayStats) return (
        <div style={{ color: 'white', textAlign: 'center', paddingTop: '20vh', position: 'relative', zIndex: 10 }}>
            <p>Loading stats...</p>
            <button onClick={onReset} style={{
                marginTop: '1rem',
                padding: '0.8rem 2rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                borderRadius: '30px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontSize: '0.9rem'
            }}>
                Reset Data
            </button>
        </div>
    );

    const totalWeeks = Math.floor(displayStats.expectancy * 52);
    const livedWeeks = Math.floor(age * 52);
    const batteryPercentage = Math.max(0, Math.min(100, (displayStats.remainingYears / displayStats.expectancy) * 100));

    // Calculate max hours for visualization (approximate)
    const lifeExpectancy = customLifeExpectancy || lifeExpectancyData[country] || lifeExpectancyData['Global'];
    
    return (
        <div ref={visualizationRef} className={`visualization-wrapper ${visible ? 'visible' : ''}`} style={{
            opacity: visible ? 1 : 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: visible ? 'translate(-50%, -50%)' : 'translate(-50%, -30%)',
            zIndex: 10,
            transition: 'opacity 0.8s ease-out, transform 0.8s ease-out'
        }}>
            {/* Title above counter */}
            <h1 className="app-title" style={{
                fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
                marginBottom: '1.5rem',
                textAlign: 'center'
            }}>
                {tt('detail.lifeIfTitle', { years: lifeExpectancy.toFixed(1) })}
            </h1>
            
            {/* Countdown Timer */}
            <div className="countdown-card" style={{
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Percentage Display - Bottom Left */}
                {displayStats && (
                    <div style={{
                        position: 'absolute',
                        bottom: '0.5rem',
                        left: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'rgba(255, 255, 255, 0.6)',
                        zIndex: 3,
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.05em'
                    }}>
                        {Math.round(displayStats.remainingYears / displayStats.expectancy * 100)}%
                    </div>
                )}
                
                {/* Used Life - Right Side (erased part) */}
                {displayStats && (
                    <div style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: `${100 - (displayStats.remainingYears / displayStats.expectancy * 100)}%`,
                        background: 'rgba(0, 0, 0, 0.3)',
                        transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        zIndex: 1
                    }} />
                )}
                
                {/* Remaining Life - Left Side (beautiful gradient) */}
                {displayStats && (
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${displayStats.remainingYears / displayStats.expectancy * 100}%`,
                        background: (() => {
                            const percentage = displayStats ? (displayStats.remainingYears / displayStats.expectancy * 100) : 0;
                            if (percentage > 60) {
                                return 'linear-gradient(to right, #10b981 0%, #34d399 50%, #6ee7b7 100%)'; // Green gradient
                            } else if (percentage > 30) {
                                return 'linear-gradient(to right, #f59e0b 0%, #fbbf24 50%, #fcd34d 100%)'; // Amber gradient
                            } else {
                                return 'linear-gradient(to right, #ef4444 0%, #f87171 50%, #fca5a5 100%)'; // Red gradient
                            }
                        })(),
                        opacity: 0.15,
                        transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        zIndex: 1
                    }} />
                )}
                
                {timeComponents ? (
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                        position: 'relative',
                        zIndex: 2
                    }}>
                        {/* First row: 残り 日 時間 分 */}
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            gap: '0.5rem',
                            flexWrap: 'wrap'
                        }}>
                            <span style={{
                                fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
                                fontWeight: 300,
                                color: 'var(--color-text-primary)',
                                opacity: 0.8,
                                marginRight: '0.5rem'
                            }}>
                                {tt('tank.remaining')}
                            </span>
                            <TimeUnit value={timeComponents.days} label={t.days} isWide isSmall />
                            <TimeUnit value={pad(timeComponents.hours)} label={t.hours} isSmall />
                            <TimeUnit value={pad(timeComponents.minutes)} label={t.minutes} isSmall />
                        </div>
                        
                        {/* Second row: 秒 .00 (centered) with slide animation */}
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'baseline', 
                            justifyContent: 'center',
                            gap: '0.3rem',
                            position: 'relative',
                            height: 'clamp(3rem, 7vw, 5rem)',
                            overflow: 'hidden'
                        }}>
                            {/* Seconds */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: '0.3rem'
                            }}>
                                <span style={{
                                    fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                                    fontWeight: 200,
                                    fontFamily: 'var(--font-mono)',
                                    lineHeight: 1,
                                    minWidth: '2ch',
                                    textAlign: 'center',
                                    display: 'inline-block',
                                    textShadow: '0 0 30px rgba(255, 255, 255, 0.1)'
                                }}>{pad(timeComponents.seconds)}</span>
                                <span style={{
                                    fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                                    textTransform: 'uppercase',
                                    opacity: 0.4,
                                    fontWeight: 500,
                                    letterSpacing: '0.2em'
                                }}>{t.seconds}</span>
                            </div>
                            {/* Milliseconds */}
                            <span style={{
                                fontSize: 'clamp(2rem, 5vw, 3rem)',
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono)',
                                color: themeColor,
                                transition: 'opacity 0.2s ease-out',
                                textShadow: '0 0 30px rgba(255, 255, 255, 0.2)'
                            }}>.{pad(timeComponents.milliseconds)}</span>
                        </div>
                    </div>
                ) : (
                    <div style={{ fontSize: '3rem', fontWeight: 900 }}>...</div>
                )}
            </div>

            {/* Navigation Buttons */}
            {onNavigate && (
                <>
                    <button
                        onClick={() => onNavigate('prev')}
                        style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '2rem',
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            zIndex: 100,
                            pointerEvents: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(4px)'
                        }}
                        aria-label="Previous"
                    >
                        ‹
                    </button>
                    <button
                        onClick={() => onNavigate('next')}
                        style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '2rem',
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            zIndex: 100,
                            pointerEvents: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(4px)'
                        }}
                        aria-label="Next"
                    >
                        ›
                    </button>
                </>
            )}

        </div>
    );
};

// Re-export sibling components so existing imports
//   import Visualization, { UserSettings, PeopleSettings } from './Visualization'
// continue to work after the Phase 4.3 split.
export { UserSettings, PeopleSettings };
export default Visualization;
