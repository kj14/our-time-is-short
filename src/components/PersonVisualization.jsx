import React, { useState, useEffect } from 'react';
import { calculateTimeWithPerson, getLifeExpectancy } from '../utils/calculations';
import { useT, isJapaneseLanguage } from '../i18n';

const PersonVisualization = ({
    person,
    displayMode, // 'time' or 'percentage'
    onDisplayModeChange,
    onBack,
    onSettingsClick,
    onNavigate,
    isJapan, // legacy; ignored when userCountry is provided
    userAge = 44,
    userCountry = 'Japan'
}) => {
    const t = useT(userCountry);
    const localeIsJapan = isJapaneseLanguage(userCountry);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(false);
        const timer = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(timer);
    }, [person?.id]);

    if (!person) {
        return null;
    }

    const personForCalc = {
        ...person,
        meetingFrequency: person.meetingFrequency || 12,
        hoursPerMeeting: person.hoursPerMeeting || 2
    };
    const result = calculateTimeWithPerson({
        person: personForCalc,
        userAge,
        country: userCountry,
        // remainingYears omitted → util infers from country + age
    });
    const totalHours = result.hours;
    const totalMeetings = result.meetings;
    const totalDays = result.days;

    // % denominator: user's full remaining life in hours, regardless of how
    // long this particular person will be around for.
    const userLifeExpectancy = getLifeExpectancy(userCountry);
    const userRemainingYears = Math.max(0, userLifeExpectancy - userAge);
    const userRemainingHours = userRemainingYears * 365.25 * 24;
    const percentage = userRemainingHours > 0 ? (totalHours / userRemainingHours) * 100 : 0;

    const conditionText = (() => {
        const freqStr = localeIsJapan
            ? (person.meetingFrequency >= 12
                ? t('pv.freqMonthly', { n: Math.round(person.meetingFrequency / 12) })
                : t('pv.freqYearly', { n: person.meetingFrequency }))
            : `${person.meetingFrequency}x/year`;
        return localeIsJapan
            ? t('pv.condition', { freq: freqStr, hours: person.hoursPerMeeting })
            : t('pv.conditionEn', { freq: freqStr, hours: person.hoursPerMeeting });
    })();

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
            <h1 className="app-title" style={{
                fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
                marginBottom: '1.5rem',
                textAlign: 'center'
            }}>
                {person.name}{t('pv.timeRemainingSuffix')}
            </h1>

            <div className="countdown-card" style={{ position: 'relative', overflow: 'hidden' }}>
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
                        {t('pv.timeMode')}
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
                        {t('pv.percentMode')}
                    </button>
                </div>

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

                <div style={{ position: 'relative', zIndex: 2, paddingTop: '0.5rem' }}>
                    {displayMode === 'time' ? (
                        <>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '1.5rem',
                                flexWrap: 'wrap',
                                marginTop: '0.5rem'
                            }}>
                                <PVStat value={Math.round(totalHours).toLocaleString()} label={t('unit.hours')} color="#3b82f6" />
                                <PVStat value={Math.round(totalMeetings).toLocaleString()} label={t('unit.times')} color="#8b5cf6" />
                                <PVStat value={totalDays.toFixed(1)} label={t('unit.days')} color="#10b981" />
                            </div>

                            <div style={{
                                marginTop: '1rem',
                                fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)',
                                color: 'rgba(255, 255, 255, 0.4)',
                                fontFamily: 'var(--font-mono)'
                            }}>
                                {conditionText}
                            </div>
                        </>
                    ) : (
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
                                {t('pv.percentOfRemaining')}
                            </div>

                            <div style={{
                                marginTop: '1rem',
                                fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)',
                                color: 'rgba(255, 255, 255, 0.4)',
                                fontFamily: 'var(--font-mono)'
                            }}>
                                = {Math.round(totalHours).toLocaleString()} {t('unit.hours')}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {onNavigate && (
                <>
                    <button
                        onClick={() => onNavigate('prev')}
                        style={navBtn('left')}
                        aria-label={t('pv.prev')}
                    >
                        ‹
                    </button>
                    <button
                        onClick={() => onNavigate('next')}
                        style={navBtn('right')}
                        aria-label={t('pv.next')}
                    >
                        ›
                    </button>
                </>
            )}
        </div>
    );
};

const PVStat = ({ value, label, color }) => (
    <div>
        <div style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: '200',
            color,
            fontFamily: 'var(--font-mono)',
            lineHeight: 1
        }}>{value}</div>
        <div style={{
            fontSize: 'clamp(0.6rem, 1.5vw, 0.8rem)',
            color: 'rgba(255, 255, 255, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginTop: '0.25rem'
        }}>{label}</div>
    </div>
);

const navBtn = (side) => ({
    position: 'absolute',
    [side]: '10px',
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
});

export default PersonVisualization;
