import React, { useState, useMemo, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { calculateLifeStats, translations, lifeExpectancyData, healthyLifeExpectancyData, workingAgeLimitData } from '../utils/lifeData';
import EnergyTank from './EnergyTank';

const FREQUENCY_LABELS_JP = {
    365: '毎日',
    104: '週に2回',
    52: '週に1回',
    24: '月に2回',
    12: '月に1回',
    1: '年に1回'
};

const FREQUENCY_LABELS_EN = {
    365: 'Daily',
    104: 'Twice a week',
    52: 'Weekly',
    24: 'Twice a month',
    12: 'Monthly',
    1: 'Once a year'
};

const HOURS_LABELS_JP = {
    0.5: '30分',
    1: '1時間',
    2: '2時間',
    3: '3時間',
    6: '半日',
    24: '1日'
};

const HOURS_LABELS_EN = {
    0.5: '30 min',
    1: '1 hour',
    2: '2 hours',
    3: '3 hours',
    6: 'Half day',
    24: '1 day'
};

const getFrequencyLabel = (frequency, isJapan) => {
    const map = isJapan ? FREQUENCY_LABELS_JP : FREQUENCY_LABELS_EN;
    if (map[frequency]) return map[frequency];
    if (isJapan) {
        return `年に${frequency}回`;
    }
    return `${frequency} times/year`;
};

const getHoursLabel = (hours, isJapan) => {
    const map = isJapan ? HOURS_LABELS_JP : HOURS_LABELS_EN;
    if (map[hours]) return map[hours];
    const formatted = Number(hours).toString().replace(/\.0$/, '');
    if (isJapan) {
        return `${formatted}時間`;
    }
    const isPlural = Number(formatted) !== 1;
    return `${formatted} hour${isPlural ? 's' : ''}`;
};

const getConditionText = (person, isJapan) => {
    const freqLabel = getFrequencyLabel(person.meetingFrequency || 0, isJapan);
    const hoursLabel = getHoursLabel(person.hoursPerMeeting || 0, isJapan);
    return `${freqLabel} × ${hoursLabel}`;
};

// Calculate age from birthdate or use direct age
const calculateAge = (person) => {
    if (person.age !== undefined && person.age !== null) {
        return Number(person.age);
    }
    
    if (!person.birthYear || !person.birthMonth || !person.birthDay) return null;
    
    const today = new Date();
    const birthDate = new Date(person.birthYear, person.birthMonth - 1, person.birthDay);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
    }
    
    return age;
};

// LifeEvents component (simplified version)
const LifeEvents = ({ remainingYears, people, userAge, userCountry }) => {
    const isJapan = userCountry === 'Japan';
    
    const events = useMemo(() => {
        const eventList = [];
        const currentYear = new Date().getFullYear();
        
        people.forEach(person => {
            const personAge = calculateAge(person);
            if (personAge === null) return;
            
            const personLifeExpectancy = lifeExpectancyData[userCountry] || lifeExpectancyData['Global'];
            const personRemainingYears = Math.max(0, personLifeExpectancy - personAge);
            
            const overlapYears = Math.min(remainingYears, personRemainingYears);
            const totalMeetings = overlapYears * person.meetingFrequency;
            
            if (totalMeetings > 0) {
                eventList.push({
                    name: person.name,
                    meetings: totalMeetings,
                    years: overlapYears,
                    color: person.color || '#818cf8'
                });
            }
        });
        
        return eventList.sort((a, b) => b.meetings - a.meetings);
    }, [remainingYears, people, userCountry]);
    
    if (events.length === 0) return null;
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {events.map((event, index) => (
                <div key={index} style={{
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: `1px solid ${event.color}40`
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>{event.name}</span>
                        <span style={{ opacity: 0.7 }}>
                            {isJapan ? `${event.meetings.toFixed(0)}回` : `${event.meetings.toFixed(0)} times`}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

const DetailPage = ({ 
    country, 
    age, 
    lifeExpectancy: customLifeExpectancy, 
    healthyLifeExpectancy: customHealthyLifeExpectancy, 
    workingAgeLimit: customWorkingAgeLimit, 
    calculationBasis, 
    onCalculationBasisChange, 
    onReset,
    onOpenSettingsWithPerson,
    people,
    displayMode: externalDisplayMode,
    onDisplayModeChange,
    onBack
}) => {
    const [displayMode, setDisplayMode] = useState(() => {
        const saved = localStorage.getItem('lifevis_displayMode');
        return saved || 'percentage';
    });
    const [isCapturing, setIsCapturing] = useState(false);
    const [shareMessage, setShareMessage] = useState(null);
    
    const detailPageRef = useRef(null);
    const shareCardRef = useRef(null);
    
    const t = translations[country] || translations['default'];
    
    // Use external displayMode if provided, otherwise use internal state
    const currentDisplayMode = externalDisplayMode !== undefined ? externalDisplayMode : displayMode;
    const handleDisplayModeChange = onDisplayModeChange || setDisplayMode;
    
    // Save display mode to localStorage
    useEffect(() => {
        localStorage.setItem('lifevis_displayMode', currentDisplayMode);
    }, [currentDisplayMode]);
    
    // Calculate maxLifeHours for hours comparison mode
    const maxLifeHours = useMemo(() => {
        const lifeExpectancy = customLifeExpectancy || lifeExpectancyData[country] || lifeExpectancyData['Global'];
        return lifeExpectancy * 365.25 * 24;
    }, [customLifeExpectancy, country]);
    
    const displayStats = useMemo(() => {
        return calculateLifeStats(country, age, customLifeExpectancy || lifeExpectancyData[country] || lifeExpectancyData['Global']);
    }, [country, age, customLifeExpectancy]);
    
    const selectedRemainingYears = useMemo(() => {
        const lifeExpectancy = customLifeExpectancy || lifeExpectancyData[country] || lifeExpectancyData['Global'];
        const healthyLifeExpectancy = customHealthyLifeExpectancy || healthyLifeExpectancyData[country] || healthyLifeExpectancyData['Global'];
        const workingAgeLimit = customWorkingAgeLimit || workingAgeLimitData[country] || workingAgeLimitData['Global'];
        
        if (calculationBasis === 'healthy') {
            return Math.max(0, healthyLifeExpectancy - age);
        } else if (calculationBasis === 'working') {
            return Math.max(0, workingAgeLimit - age);
        } else {
            return Math.max(0, lifeExpectancy - age);
        }
    }, [calculationBasis, age, customLifeExpectancy, customHealthyLifeExpectancy, customWorkingAgeLimit, country]);
    
    const handleOpenUserSettings = () => {
        onOpenSettingsWithPerson('user-settings');
    };
    
    // Share functionality
    const handleShareToX = async () => {
        if (!shareCardRef.current) return;
        
        setIsCapturing(true);
        setShareMessage(null);
        
        try {
            const canvas = await html2canvas(shareCardRef.current, {
                backgroundColor: '#050505',
                scale: 2,
                logging: false,
                useCORS: true
            });
            
            canvas.toBlob((blob) => {
                if (!blob) {
                    setIsCapturing(false);
                    return;
                }
                
                const file = new File([blob], 'life-visualization.png', { type: 'image/png' });
                const shareData = {
                    files: [file],
                    text: country === 'Japan' 
                        ? `残り${displayStats.remainingYears.toFixed(1)}年。時間を可視化しました。 #OurTimeIsShort`
                        : `${displayStats.remainingYears.toFixed(1)} years remaining. I visualized my time. #OurTimeIsShort`
                };
                
                if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                    navigator.share(shareData).catch(() => {
                        openXWeb();
                    });
                } else {
                    openXWeb();
                }
                
                setIsCapturing(false);
            }, 'image/png');
        } catch (error) {
            console.error('Error capturing share card:', error);
            setIsCapturing(false);
            setShareMessage(country === 'Japan' ? 'シェアに失敗しました' : 'Share failed');
        }
    };
    
    const openXWeb = () => {
        const text = country === 'Japan' 
            ? `残り${displayStats.remainingYears.toFixed(1)}年。時間を可視化しました。 #OurTimeIsShort`
            : `${displayStats.remainingYears.toFixed(1)} years remaining. I visualized my time. #OurTimeIsShort`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        
        // Try to open X app first on mobile
        if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
            const appUrl = `twitter://post?message=${encodeURIComponent(text)}`;
            window.location.href = appUrl;
            
            // Fallback to web after delay if app didn't open
            let fallbackTimeout;
            const handleVisibilityChange = () => {
                if (document.hidden) {
                    clearTimeout(fallbackTimeout);
                }
            };
            const handleBlur = () => {
                clearTimeout(fallbackTimeout);
            };
            const handlePageHide = () => {
                clearTimeout(fallbackTimeout);
            };
            
            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('blur', handleBlur);
            window.addEventListener('pagehide', handlePageHide);
            
            fallbackTimeout = setTimeout(() => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                window.removeEventListener('blur', handleBlur);
                window.removeEventListener('pagehide', handlePageHide);
                window.open(url, '_blank');
            }, 2000);
        } else {
            window.open(url, '_blank');
        }
    };
    
    const shareButtonLabel = isCapturing
        ? (country === 'Japan' ? '準備中...' : 'Preparing...')
        : (country === 'Japan' ? 'Xでシェア' : 'Share on X');
    
    return (
        <div ref={detailPageRef} className="detail-page-wrapper" style={{
            padding: '2rem 0',
            minHeight: '100vh'
        }}>
            {/* Hidden Share Card Layout */}
            <div ref={shareCardRef} style={{
                position: 'absolute',
                top: 0,
                left: '-9999px',
                width: '1200px',
                height: '675px',
                background: '#050505',
                color: 'white',
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-main)',
                zIndex: -1
            }}>
                {/* Share card content - same as before */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', flex: 1, margin: '40px 0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ marginBottom: '1rem', fontSize: '1.2rem', opacity: 0.8 }}>YOUR LIFE</div>
                        <div style={{ position: 'relative', height: '60px', background: 'rgba(255,255,255,0.1)', borderRadius: '30px', overflow: 'hidden' }}>
                            <div style={{ 
                                width: `${Math.max(0, Math.min(100, (displayStats?.remainingYears / displayStats?.expectancy) * 100))}%`, 
                                height: '100%', 
                                background: '#06b6d4',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                paddingRight: '20px'
                            }}>
                                <span style={{ color: '#000', fontWeight: 800, fontSize: '1.2rem' }}>
                                    {Math.max(0, Math.min(100, (displayStats?.remainingYears / displayStats?.expectancy) * 100)).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', opacity: 0.6, fontSize: '0.9rem' }}>
                            <span>Lived: {age?.toFixed(1)}y</span>
                            <span>Total: {displayStats?.expectancy.toFixed(1)}y</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {people.slice(0, 3).map(person => {
                            const pAge = calculateAge(person);
                            if (pAge === null) return null;
                            const pExp = lifeExpectancyData[country] || 80;
                            const limit = pAge < age ? pExp : pExp; 
                            const yearsWith = Math.max(0, limit - pAge);
                            const effYears = Math.min(yearsWith, displayStats?.remainingYears || 0);
                            const meetings = effYears * person.meetingFrequency;
                            const hours = meetings * person.hoursPerMeeting;
                            const totalOverlap = pAge < age ? pAge + effYears : age + effYears;
                            const livedOverlap = pAge < age ? pAge : age;
                            const pct = Math.max(5, Math.min(100, (hours / (hours + (livedOverlap * person.meetingFrequency * person.hoursPerMeeting))) * 100));
                            
                            return (
                                <div key={person.id} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '100px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {person.name}
                                    </div>
                                    <div style={{ flex: 1, height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: person.color || '#818cf8' }}></div>
                                    </div>
                                    <div style={{ width: '80px', textAlign: 'right', fontSize: '0.9rem', opacity: 0.8 }}>
                                        {meetings.toFixed(0)} {country === 'Japan' ? '回' : 'times'}
                                    </div>
                                </div>
                            );
                        })}
                        {people.length === 0 && (
                            <div style={{ opacity: 0.4, fontStyle: 'italic' }}>
                                {country === 'Japan' ? '大切な人を追加して時間を可視化しましょう' : 'Add people to visualize shared time'}
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ 
                    borderTop: '1px solid rgba(255,255,255,0.1)', 
                    paddingTop: '20px', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ fontSize: '0.9rem', opacity: 0.5 }}>
                        #OurTimeIsShort
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '1px' }}>
                        letmeknow.life
                    </div>
                </div>
            </div>

            {/* Energy Dashboard */}
            <div style={{ marginBottom: '3rem' }}>
                {/* Display Mode Toggle - Segment Control */}
                <div className="segment-control-wrapper">
                    <div className="segment-control">
                        <div 
                            className="segment-slider"
                            style={{
                                transform: currentDisplayMode === 'hours' ? 'translateX(100%)' : 'translateX(0)'
                            }}
                        />
                        <button
                            className={`segment-btn ${currentDisplayMode === 'percentage' ? 'active' : ''}`}
                            onClick={() => handleDisplayModeChange('percentage')}
                        >
                            {country === 'Japan' ? '残量' : 'Remaining'}
                        </button>
                        <button
                            className={`segment-btn ${currentDisplayMode === 'hours' ? 'active' : ''}`}
                            onClick={() => handleDisplayModeChange('hours')}
                        >
                            {country === 'Japan' ? '時間比較' : 'Hours'}
                        </button>
                    </div>
                </div>
                
                {(() => {
                    const lifeExpectancy = customLifeExpectancy || lifeExpectancyData[country] || lifeExpectancyData['Global'];
                    const healthyLifeExpectancy = customHealthyLifeExpectancy || healthyLifeExpectancyData[country] || healthyLifeExpectancyData['Global'];
                    const workingAgeLimit = customWorkingAgeLimit || workingAgeLimitData[country] || workingAgeLimitData['Global'];
                    
                    const remainingLifeYears = Math.max(0, lifeExpectancy - age);
                    const remainingLifeHours = remainingLifeYears * 365.25 * 24;
                    const maxLifeHours = lifeExpectancy * 365.25 * 24;
                    
                    const remainingHealthyYears = Math.max(0, healthyLifeExpectancy - age);
                    const remainingHealthyHours = remainingHealthyYears * 365.25 * 24;
                    const maxHealthyHours = healthyLifeExpectancy * 365.25 * 24;
                    
                    const remainingWorkingYears = Math.max(0, workingAgeLimit - age);
                    const remainingWorkingHours = remainingWorkingYears * 365.25 * 24;
                    const maxWorkingHours = workingAgeLimit * 365.25 * 24;
                    
                    const allBatteries = [
                        {
                            label: "人生",
                            hours: remainingLifeHours,
                            maxHours: maxLifeHours,
                            color: "#06b6d4",
                            years: remainingLifeYears,
                            basis: 'life'
                        },
                        {
                            label: "健康",
                            hours: remainingHealthyHours,
                            maxHours: maxHealthyHours,
                            color: "#34d399",
                            years: remainingHealthyYears,
                            basis: 'healthy'
                        },
                        {
                            label: "仕事",
                            hours: remainingWorkingHours,
                            maxHours: maxWorkingHours,
                            color: "#fbbf24",
                            years: remainingWorkingYears,
                            basis: 'working'
                        }
                    ];
                    
                    const commonMaxHours = currentDisplayMode === 'hours' ? maxLifeHours : null;
                    
                    return (
                        <div className="main-batteries-row">
                            {allBatteries.map((battery, index) => {
                                const isSelected = battery.basis === calculationBasis;
                                return (
                                    <EnergyTank
                                        key={index}
                                        label={battery.label}
                                        hours={battery.hours}
                                        maxHours={commonMaxHours || battery.maxHours}
                                        color={battery.color}
                                        t={t}
                                        country={country}
                                        isSelected={isSelected}
                                        subtitle={`${battery.years.toFixed(1)}年`}
                                        onClick={handleOpenUserSettings}
                                        displayMode={currentDisplayMode}
                                    />
                                );
                            })}
                        </div>
                    );
                })()}
                
                {/* People Batteries */}
                <div className="energy-tanks-container">
                    {people.map(person => {
                        const personAge = calculateAge(person);
                        if (personAge === null) return null;

                        const personLifeExpectancy = lifeExpectancyData[country] || lifeExpectancyData['Global'];
                        const personRemainingYears = Math.max(0, personLifeExpectancy - personAge);

                        const remainingYearsBasedOnBasis = selectedRemainingYears;

                        let pastOverlapYears;
                        let futureOverlapYears;

                        if (personAge < age) {
                            pastOverlapYears = personAge;
                            futureOverlapYears = Math.min(remainingYearsBasedOnBasis, personRemainingYears);
                        } else {
                            pastOverlapYears = age;
                            futureOverlapYears = Math.min(personRemainingYears, remainingYearsBasedOnBasis);
                        }

                        pastOverlapYears = Math.max(0, pastOverlapYears);
                        futureOverlapYears = Math.max(0, futureOverlapYears);

                        const totalOverlapYears = pastOverlapYears + futureOverlapYears;
                        const totalMeetings = futureOverlapYears * person.meetingFrequency;
                        const hours = futureOverlapYears * person.meetingFrequency * person.hoursPerMeeting;
                        const totalLifeHours = totalOverlapYears * person.meetingFrequency * person.hoursPerMeeting || 1;
                        const isJapan = country === 'Japan';
                        const conditionText = getConditionText(person, isJapan);
                        const meetingsLabel = isJapan
                            ? `残り${Math.max(0, totalMeetings).toFixed(0)}回`
                            : `${Math.max(0, totalMeetings).toFixed(0)} times left`;

                        const personMaxHours = currentDisplayMode === 'hours' ? maxLifeHours : totalLifeHours;

                        return (
                            <EnergyTank
                                key={person.id}
                                label={person.name}
                                hours={hours}
                                maxHours={personMaxHours}
                                conditionText={conditionText}
                                color={person.color || '#818cf8'}
                                t={t}
                                country={country}
                                subtitle={meetingsLabel}
                                onClick={() => onOpenSettingsWithPerson(person.id)}
                                displayMode={currentDisplayMode}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Life Events */}
            {people.length > 0 && (
                <div style={{ marginBottom: '6rem' }}>
                    <h3 style={{
                        marginBottom: '2rem',
                        textAlign: 'center',
                        fontSize: '1.5rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        opacity: 0.8
                    }}>{country === 'Japan' ? '人生のイベント' : 'Life Events'}</h3>
                    <LifeEvents 
                        remainingYears={displayStats.remainingYears} 
                        people={people}
                        userAge={age}
                        userCountry={country}
                    />
                </div>
            )}

            <div className="primary-actions" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                marginTop: '3rem',
                marginBottom: '3rem'
            }}>
                {onBack && (
                    <button className="outline-button" onClick={onBack} style={{ 
                        width: '100%',
                        maxWidth: '300px'
                    }}>
                        {country === 'Japan' ? 'メイン画面に戻る' : 'Back to Main'}
                    </button>
                )}
                <button className="share-button share-x" onClick={handleShareToX} disabled={isCapturing} style={{
                    width: '100%',
                    maxWidth: '300px'
                }}>
                    <span className="share-icon">𝕏</span>
                    <span>{shareButtonLabel}</span>
                </button>
                <button className="outline-button" onClick={onReset} style={{
                    width: '100%',
                    maxWidth: '300px'
                }}>
                    {t.startOver}
                </button>
            </div>
            {shareMessage && (
                <p className="share-message">{shareMessage}</p>
            )}
        </div>
    );
};

export default DetailPage;

