import React, { useState, useEffect } from 'react';
import { lifeExpectancyData } from '../utils/lifeData';

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

const PersonVisualization = ({ 
    person, 
    displayMode, // 'time' or 'percentage'
    onDisplayModeChange,
    onBack,
    onSettingsClick,
    isJapan = true,
    userAge = 44,
    userCountry = 'Japan'
}) => {
    const [visible, setVisible] = useState(false);
    
    // Trigger fade-in animation on mount AND when person changes
    useEffect(() => {
        // Reset visibility when person changes
        setVisible(false);
        
        // Trigger fade-in after a brief delay
        const timer = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(timer);
    }, [person?.id]); // Re-trigger when switching between people
    
    if (!person) {
        return null;
    }

    const personAge = calculateAge(person) || 30;
    const lifeExpectancy = lifeExpectancyData[userCountry] || lifeExpectancyData['Global'];
    
    // Calculate remaining time together
    const userRemainingYears = Math.max(0, lifeExpectancy - userAge);
    const personRemainingYears = Math.max(0, lifeExpectancy - personAge);
    const effectiveYears = Math.min(userRemainingYears, personRemainingYears);
    
    const totalMeetings = effectiveYears * (person.meetingFrequency || 12);
    const totalHours = totalMeetings * (person.hoursPerMeeting || 2);
    const totalDays = totalHours / 24;
    
    // Calculate percentage (of user's remaining life spent with this person)
    const userRemainingHours = userRemainingYears * 365.25 * 24;
    const percentage = userRemainingHours > 0 ? (totalHours / userRemainingHours) * 100 : 0;

    return (
        <div className={`visualization-wrapper ${visible ? 'visible' : ''}`} style={{
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
            {/* Title above card - same style as Visualization */}
            <h1 className="app-title" style={{
                fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
                marginBottom: '1.5rem',
                textAlign: 'center'
            }}>
                {person.name} {isJapan ? 'との残り時間' : ' - Time Remaining'}
            </h1>

            {/* Card with Toggle - same style as Visualization */}
            <div className="countdown-card" style={{
                position: 'relative',
                overflow: 'hidden'
            }}>
                    
                    {/* Display Mode Toggle - Top Right of Card */}
                    <div style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        display: 'flex',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        padding: '3px',
                        zIndex: 3
                    }}>
                        <button
                            onClick={() => onDisplayModeChange('time')}
                            style={{
                                padding: '0.35rem 0.75rem',
                                border: 'none',
                                borderRadius: '4px',
                                background: displayMode === 'time' ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                fontFamily: 'var(--font-mono)',
                                transition: 'background 0.2s'
                            }}
                        >
                            {isJapan ? '時間' : 'Time'}
                        </button>
                        <button
                            onClick={() => onDisplayModeChange('percentage')}
                            style={{
                                padding: '0.35rem 0.75rem',
                                border: 'none',
                                borderRadius: '4px',
                                background: displayMode === 'percentage' ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                fontFamily: 'var(--font-mono)',
                                transition: 'background 0.2s'
                            }}
                        >
                            %
                        </button>
                    </div>

                    {/* Percentage Display - Bottom Left (same as Visualization) */}
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
                        {percentage.toFixed(2)}%
                    </div>

                    {/* Content wrapper with padding for buttons */}
                    <div style={{
                        position: 'relative',
                        zIndex: 2,
                        paddingTop: '0.5rem'
                    }}>
                        {displayMode === 'time' ? (
                            /* Time Display */
                            <>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: '1.5rem',
                                    flexWrap: 'wrap',
                                    marginTop: '0.5rem'
                                }}>
                                    <div>
                                        <div style={{
                                            fontSize: 'clamp(2rem, 5vw, 3rem)',
                                            fontWeight: '200',
                                            color: '#3b82f6',
                                            fontFamily: 'var(--font-mono)',
                                            lineHeight: 1
                                        }}>
                                            {Math.round(totalHours).toLocaleString()}
                                        </div>
                                        <div style={{
                                            fontSize: 'clamp(0.6rem, 1.5vw, 0.8rem)',
                                            color: 'rgba(255, 255, 255, 0.5)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.2em',
                                            marginTop: '0.25rem'
                                        }}>
                                            {isJapan ? '時間' : 'hours'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{
                                            fontSize: 'clamp(2rem, 5vw, 3rem)',
                                            fontWeight: '200',
                                            color: '#8b5cf6',
                                            fontFamily: 'var(--font-mono)',
                                            lineHeight: 1
                                        }}>
                                            {Math.round(totalMeetings).toLocaleString()}
                                        </div>
                                        <div style={{
                                            fontSize: 'clamp(0.6rem, 1.5vw, 0.8rem)',
                                            color: 'rgba(255, 255, 255, 0.5)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.2em',
                                            marginTop: '0.25rem'
                                        }}>
                                            {isJapan ? '回' : 'times'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{
                                            fontSize: 'clamp(2rem, 5vw, 3rem)',
                                            fontWeight: '200',
                                            color: '#10b981',
                                            fontFamily: 'var(--font-mono)',
                                            lineHeight: 1
                                        }}>
                                            {totalDays.toFixed(1)}
                                        </div>
                                        <div style={{
                                            fontSize: 'clamp(0.6rem, 1.5vw, 0.8rem)',
                                            color: 'rgba(255, 255, 255, 0.5)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.2em',
                                            marginTop: '0.25rem'
                                        }}>
                                            {isJapan ? '日' : 'days'}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Sub info */}
                                <div style={{
                                    marginTop: '1rem',
                                    fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)',
                                    color: 'rgba(255, 255, 255, 0.4)',
                                    fontFamily: 'var(--font-mono)'
                                }}>
                                    {isJapan 
                                        ? `${person.meetingFrequency >= 12 ? '月' + Math.round(person.meetingFrequency / 12) + '回' : '年' + person.meetingFrequency + '回'} × ${person.hoursPerMeeting}時間`
                                        : `${person.meetingFrequency}x/year × ${person.hoursPerMeeting}h`
                                    }
                                </div>
                            </>
                        ) : (
                            /* Percentage Display - Large centered percentage */
                            <div style={{ 
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '1rem 0'
                            }}>
                                <div style={{
                                    fontSize: 'clamp(3rem, 8vw, 5rem)',
                                    fontWeight: '200',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    fontFamily: 'var(--font-mono)',
                                    lineHeight: 1,
                                    textShadow: '0 0 30px rgba(59, 130, 246, 0.3)'
                                }}>
                                    {percentage.toFixed(2)}%
                                </div>
                                <div style={{
                                    fontSize: 'clamp(0.7rem, 1.5vw, 0.9rem)',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    marginTop: '0.75rem'
                                }}>
                                    {isJapan ? 'あなたの残り人生のうち' : 'of your remaining life'}
                                </div>
                                
                                {/* Hours equivalent */}
                                <div style={{
                                    marginTop: '1rem',
                                    fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)',
                                    color: 'rgba(255, 255, 255, 0.4)',
                                    fontFamily: 'var(--font-mono)'
                                }}>
                                    = {Math.round(totalHours).toLocaleString()} {isJapan ? '時間' : 'hours'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
        </div>
    );
};

export default PersonVisualization;

