import React from 'react';
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
        <div className="visualization-wrapper">
            {/* Main Display */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: '2rem'
            }}>
                {/* Person Name */}
                <h2 style={{
                    fontSize: '1.2rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '0.5rem',
                    fontWeight: '400'
                }}>
                    {person.name} {isJapan ? 'との残り時間' : ' - Time Remaining'}
                </h2>

                {/* Card with Toggle */}
                <div className="countdown-card" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    padding: '2rem',
                    textAlign: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    position: 'relative',
                    minWidth: '300px',
                    pointerEvents: 'auto'
                }}>
                    {/* Settings Button - Top Left */}
                    {onSettingsClick && (
                        <button
                            onClick={onSettingsClick}
                            style={{
                                position: 'absolute',
                                top: '0.75rem',
                                left: '0.75rem',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: 'rgba(255, 255, 255, 0.7)',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 3,
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                                e.target.style.color = 'rgba(255, 255, 255, 0.9)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.target.style.color = 'rgba(255, 255, 255, 0.7)';
                            }}
                        >
                            ⚙
                        </button>
                    )}
                    
                    {/* Display Mode Toggle - Top Right of Card */}
                    <div style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        display: 'flex',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        padding: '3px'
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
                                transition: 'background 0.2s'
                            }}
                        >
                            %
                        </button>
                    </div>

                {displayMode === 'time' ? (
                    /* Time Display */
                    <>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '2rem',
                            flexWrap: 'wrap',
                            marginTop: '1rem'
                        }}>
                            <div>
                                <div style={{
                                    fontSize: '3rem',
                                    fontWeight: '700',
                                    color: '#3b82f6',
                                    fontFamily: 'var(--font-mono)'
                                }}>
                                    {Math.round(totalHours).toLocaleString()}
                                </div>
                                <div style={{
                                    fontSize: '0.9rem',
                                    color: 'rgba(255, 255, 255, 0.6)'
                                }}>
                                    {isJapan ? '時間' : 'hours'}
                                </div>
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '3rem',
                                    fontWeight: '700',
                                    color: '#8b5cf6',
                                    fontFamily: 'var(--font-mono)'
                                }}>
                                    {Math.round(totalMeetings).toLocaleString()}
                                </div>
                                <div style={{
                                    fontSize: '0.9rem',
                                    color: 'rgba(255, 255, 255, 0.6)'
                                }}>
                                    {isJapan ? '回' : 'times'}
                                </div>
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '3rem',
                                    fontWeight: '700',
                                    color: '#10b981',
                                    fontFamily: 'var(--font-mono)'
                                }}>
                                    {totalDays.toFixed(1)}
                                </div>
                                <div style={{
                                    fontSize: '0.9rem',
                                    color: 'rgba(255, 255, 255, 0.6)'
                                }}>
                                    {isJapan ? '日' : 'days'}
                                </div>
                            </div>
                        </div>
                        
                        {/* Sub info */}
                        <div style={{
                            marginTop: '1.5rem',
                            fontSize: '0.85rem',
                            color: 'rgba(255, 255, 255, 0.5)'
                        }}>
                            {isJapan 
                                ? `${person.meetingFrequency >= 12 ? '月' + Math.round(person.meetingFrequency / 12) + '回' : '年' + person.meetingFrequency + '回'} × ${person.hoursPerMeeting}時間`
                                : `${person.meetingFrequency}x/year × ${person.hoursPerMeeting}h`
                            }
                        </div>
                    </>
                ) : (
                    /* Percentage Display */
                    <div style={{ marginTop: '1rem' }}>
                        <div style={{
                            fontSize: '4rem',
                            fontWeight: '700',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontFamily: 'var(--font-mono)'
                        }}>
                            {percentage.toFixed(2)}%
                        </div>
                        <div style={{
                            fontSize: '0.9rem',
                            color: 'rgba(255, 255, 255, 0.6)',
                            marginTop: '0.5rem'
                        }}>
                            {isJapan ? 'あなたの残り人生のうち' : 'of your remaining life'}
                        </div>
                        
                        {/* Visual bar */}
                        <div style={{
                            marginTop: '1.5rem',
                            width: '100%',
                            height: '12px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${Math.min(percentage, 100)}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
                                borderRadius: '6px',
                                transition: 'width 0.5s ease'
                            }} />
                        </div>
                        
                        {/* Hours equivalent */}
                        <div style={{
                            marginTop: '1rem',
                            fontSize: '0.85rem',
                            color: 'rgba(255, 255, 255, 0.5)'
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

