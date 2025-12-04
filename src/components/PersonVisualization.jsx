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
        <div className="visualization-wrapper" style={{ pointerEvents: 'auto' }}>
            {/* Back Button */}
            <button
                onClick={onBack}
                style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    padding: '0.5rem 1rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    zIndex: 100
                }}
            >
                ← {isJapan ? '戻る' : 'Back'}
            </button>

            {/* Display Mode Toggle */}
            <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '4px',
                zIndex: 100
            }}>
                <button
                    onClick={() => onDisplayModeChange('time')}
                    style={{
                        padding: '0.5rem 1rem',
                        border: 'none',
                        borderRadius: '6px',
                        background: displayMode === 'time' ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        transition: 'background 0.2s'
                    }}
                >
                    {isJapan ? '時間' : 'Time'}
                </button>
                <button
                    onClick={() => onDisplayModeChange('percentage')}
                    style={{
                        padding: '0.5rem 1rem',
                        border: 'none',
                        borderRadius: '6px',
                        background: displayMode === 'percentage' ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        transition: 'background 0.2s'
                    }}
                >
                    %
                </button>
            </div>

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

                {displayMode === 'time' ? (
                    /* Time Display */
                    <div className="countdown-card" style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '20px',
                        padding: '2rem',
                        textAlign: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '2rem',
                            flexWrap: 'wrap'
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
                    </div>
                ) : (
                    /* Percentage Display */
                    <div className="countdown-card" style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '20px',
                        padding: '2rem',
                        textAlign: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        minWidth: '280px'
                    }}>
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
    );
};

export default PersonVisualization;

