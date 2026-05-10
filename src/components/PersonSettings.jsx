import React, { useState, useEffect } from 'react';
import { getLifeExpectancy, calculateAge as canonicalAge } from '../utils/calculations';
import { useT, isJapaneseLanguage } from '../i18n';

const PLANET_OPTIONS = [
    { url: '/textures/2k_mercury.jpg',       i18nKey: 'planet.mercury' },
    { url: '/textures/2k_venus_surface.jpg', i18nKey: 'planet.venus'   },
    { url: '/textures/2k_mars.jpg',          i18nKey: 'planet.mars'    },
    { url: '/textures/2k_jupiter.jpg',       i18nKey: 'planet.jupiter' },
    { url: '/textures/2k_saturn.jpg',        i18nKey: 'planet.saturn'  },
    { url: '/textures/2k_uranus.jpg',        i18nKey: 'planet.uranus'  },
    { url: '/textures/2k_neptune.jpg',       i18nKey: 'planet.neptune' }
];

const FREQUENCY_OPTIONS = [
    { value: 365, i18nKey: 'freq.daily'       },
    { value: 104, i18nKey: 'freq.twiceWeek'   },
    { value:  52, i18nKey: 'freq.weekly'      },
    { value:  24, i18nKey: 'freq.twiceMonth'  },
    { value:  12, i18nKey: 'freq.monthly'     },
    { value:   4, i18nKey: 'freq.quarterly'   },
    { value:   1, i18nKey: 'freq.yearly'      }
];

const HOURS_OPTIONS = [
    { value: 0.5, i18nKey: 'hours.30min'   },
    { value: 1,   i18nKey: 'hours.1h'      },
    { value: 2,   i18nKey: 'hours.2h'      },
    { value: 3,   i18nKey: 'hours.3h'      },
    { value: 6,   i18nKey: 'hours.halfDay' },
    { value: 24,  i18nKey: 'hours.fullDay' }
];

const RELATIONSHIP_OPTIONS = [
    { value: 'parent',  i18nKey: 'person.relationship.parent'   },
    { value: 'child',   i18nKey: 'person.relationship.child'    },
    { value: 'sibling', i18nKey: 'person.relationship.sibling'  },
    { value: 'spouse',  i18nKey: 'person.relationship.spouse'   },
    { value: 'partner', i18nKey: 'person.relationship.partner'  },
    { value: 'friend',  i18nKey: 'person.relationship.friend'   },
    { value: 'mentor',  i18nKey: 'person.relationship.mentor'   },
    { value: 'other',   i18nKey: 'person.relationship.other'    }
];

const generateId = () => `person_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const PersonSettings = ({
    person,
    onSave,
    onDelete,
    onCancel,
    onVisualize,
    isJapan, // legacy prop, ignored if userCountry is set
    userCountry = 'Japan',
    userAge,
    calculationBasis = 'life'
}) => {
    const t = useT(userCountry);
    const localeIsJapan = isJapaneseLanguage(userCountry);

    const [formData, setFormData] = useState({
        name: '',
        birthYear: '',
        birthMonth: '',
        birthDay: '',
        age: '',
        meetingFrequency: 12,
        hoursPerMeeting: 2,
        textureUrl: PLANET_OPTIONS[0].url,
        relationship: 'other',
        isMentor: false
    });
    const [useAgeInput, setUseAgeInput] = useState(false);

    useEffect(() => {
        if (person) {
            const hasAge = person.age !== undefined && person.age !== null;
            setUseAgeInput(hasAge || (!person.birthYear && !person.birthMonth && !person.birthDay));
            setFormData({
                name: person.name || '',
                birthYear: person.birthYear ? person.birthYear.toString() : '',
                birthMonth: person.birthMonth ? person.birthMonth.toString() : '',
                birthDay: person.birthDay ? person.birthDay.toString() : '',
                age: person.age !== undefined && person.age !== null ? person.age.toString() : '',
                meetingFrequency: person.meetingFrequency || 12,
                hoursPerMeeting: person.hoursPerMeeting || 2,
                textureUrl: person.textureUrl || PLANET_OPTIONS[0].url,
                relationship: person.relationship || 'other',
                isMentor: !!person.isMentor
            });
        }
    }, [person]);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 121 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const getDaysInMonth = (year, month) => {
        if (!year || !month) return 31;
        return new Date(year, month, 0).getDate();
    };
    const days = Array.from({ length: getDaysInMonth(formData.birthYear, formData.birthMonth) }, (_, i) => i + 1);

    const calculatedAge = useAgeInput
        ? (formData.age ? Number(formData.age) : null)
        : canonicalAge({
            birthYear: Number(formData.birthYear),
            birthMonth: Number(formData.birthMonth),
            birthDay: Number(formData.birthDay)
        });

    const handleSave = () => {
        if (!formData.name) {
            alert(t('person.errorName'));
            return;
        }

        const hasBirthdate = formData.birthYear && formData.birthMonth && formData.birthDay;
        const hasAge = formData.age && formData.age !== '';

        if (!hasBirthdate && !hasAge) {
            alert(t('person.errorBirthOrAge'));
            return;
        }

        const savedPerson = {
            id: person?.id || generateId(),
            name: formData.name,
            ...(hasBirthdate && !useAgeInput ? {
                birthYear: Number(formData.birthYear),
                birthMonth: Number(formData.birthMonth),
                birthDay: Number(formData.birthDay)
            } : {}),
            ...(hasAge || useAgeInput ? { age: Number(formData.age) || calculatedAge } : {}),
            meetingFrequency: Number(formData.meetingFrequency),
            hoursPerMeeting: Number(formData.hoursPerMeeting),
            textureUrl: formData.textureUrl,
            relationship: formData.relationship,
            isMentor: !!formData.isMentor
        };

        onSave(savedPerson);
    };

    const calculateSharedTime = () => {
        if (calculatedAge === null) return null;

        const effectiveUserAge = userAge ?? 44;
        const lifeExpectancy = getLifeExpectancy(userCountry, calculationBasis);
        const remainingYears = Math.max(0, lifeExpectancy - effectiveUserAge);

        const personRemainingYears = Math.max(0, lifeExpectancy - calculatedAge);
        const effectiveYears = Math.min(personRemainingYears, remainingYears);

        const totalMeetings = effectiveYears * formData.meetingFrequency;
        const totalHours = totalMeetings * formData.hoursPerMeeting;

        return {
            totalMeetings: Math.round(totalMeetings),
            totalHours: Math.round(totalHours),
            totalDays: Math.round(totalHours / 24 * 10) / 10
        };
    };

    const sharedTime = calculateSharedTime();

    return (
        <section
            className="input-section fade-in"
            style={{ animationDelay: '0.2s', padding: '1rem', boxSizing: 'border-box' }}
        >
            <p className="input-section-tagline" style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>
                {t('person.tagline')}
            </p>
            <form
                onSubmit={(e) => { e.preventDefault(); handleSave(); }}
                className="input-form"
                style={{ padding: '1.5rem', gap: '1.25rem', maxWidth: '100%', boxSizing: 'border-box' }}
            >
                {/* Name */}
                <div className="input-group">
                    <label className="input-label">{t('person.name')}</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="select-styled"
                        placeholder={t('person.namePlaceholder')}
                        aria-label={t('person.name')}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            padding: '1rem',
                            borderRadius: '12px',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                {/* Relationship */}
                <div className="input-group">
                    <label className="input-label">{t('person.relationship')}</label>
                    <select
                        value={formData.relationship}
                        onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                        className="select-styled"
                        aria-label={t('person.relationship')}
                    >
                        {RELATIONSHIP_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{t(opt.i18nKey)}</option>
                        ))}
                    </select>
                </div>

                {/* Age input toggle */}
                <div className="input-group">
                    <div style={{
                        display: 'flex', gap: '0.5rem', marginBottom: '0.5rem',
                        background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '4px'
                    }}>
                        <button
                            type="button"
                            onClick={() => setUseAgeInput(false)}
                            style={{
                                flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px',
                                background: !useAgeInput ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
                                color: 'white', cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.2s'
                            }}
                        >
                            {t('input.birthDate')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setUseAgeInput(true)}
                            style={{
                                flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px',
                                background: useAgeInput ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
                                color: 'white', cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.2s'
                            }}
                        >
                            {t('person.age')}
                        </button>
                    </div>

                    {useAgeInput ? (
                        <input
                            type="number"
                            value={formData.age}
                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                            className="select-styled"
                            placeholder={t('person.agePlaceholder')}
                            aria-label={t('person.age')}
                            min="0"
                            max="120"
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'white', padding: '1rem', borderRadius: '12px', fontSize: '1rem'
                            }}
                        />
                    ) : (
                        <div className="date-grid">
                            <select
                                value={formData.birthYear}
                                onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                                className="select-styled"
                                aria-label={t('input.year')}
                            >
                                <option value="">{t('input.year')}</option>
                                {years.map(y => (<option key={y} value={y}>{y}</option>))}
                            </select>
                            <select
                                value={formData.birthMonth}
                                onChange={(e) => setFormData({ ...formData, birthMonth: e.target.value })}
                                className="select-styled"
                                aria-label={t('input.month')}
                            >
                                <option value="">{t('input.month')}</option>
                                {months.map(m => (<option key={m} value={m}>{m}</option>))}
                            </select>
                            <select
                                value={formData.birthDay}
                                onChange={(e) => setFormData({ ...formData, birthDay: e.target.value })}
                                className="select-styled"
                                aria-label={t('input.day')}
                            >
                                <option value="">{t('input.day')}</option>
                                {days.map(d => (<option key={d} value={d}>{d}</option>))}
                            </select>
                        </div>
                    )}

                    {calculatedAge !== null && (
                        <div className="age-display">
                            {Math.floor(calculatedAge)} {t('input.ageUnit')}
                        </div>
                    )}
                </div>

                {/* Meeting Frequency */}
                <div className="input-group">
                    <label className="input-label">{t('person.frequency')}</label>
                    <select
                        value={formData.meetingFrequency}
                        onChange={(e) => setFormData({ ...formData, meetingFrequency: Number(e.target.value) })}
                        className="select-styled"
                        aria-label={t('person.frequency')}
                    >
                        {FREQUENCY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{t(opt.i18nKey)}</option>
                        ))}
                    </select>
                </div>

                {/* Hours per meeting */}
                <div className="input-group">
                    <label className="input-label">{t('person.hoursPerMeeting')}</label>
                    <select
                        value={formData.hoursPerMeeting}
                        onChange={(e) => setFormData({ ...formData, hoursPerMeeting: Number(e.target.value) })}
                        className="select-styled"
                        aria-label={t('person.hoursPerMeeting')}
                    >
                        {HOURS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{t(opt.i18nKey)}</option>
                        ))}
                    </select>
                </div>

                {/* Mentor toggle */}
                <div className="input-group" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px'
                }}>
                    <div>
                        <label htmlFor="mentor-toggle" className="input-label" style={{ marginBottom: '0.2rem' }}>
                            ★ {t('person.mentor')}
                        </label>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.55)' }}>
                            {t('person.mentorHint')}
                        </div>
                    </div>
                    <input
                        id="mentor-toggle"
                        type="checkbox"
                        checked={!!formData.isMentor}
                        onChange={(e) => setFormData({ ...formData, isMentor: e.target.checked })}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        aria-label={t('person.mentor')}
                    />
                </div>

                {/* Shared time preview */}
                {sharedTime && (
                    <div style={{
                        padding: '1.5rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem' }}>
                            {t('person.sharedTime')}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6', fontFamily: 'var(--font-mono)' }}>
                                    {sharedTime.totalHours.toLocaleString()}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                                    {localeIsJapan ? '時間' : 'hours'}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#8b5cf6', fontFamily: 'var(--font-mono)' }}>
                                    {sharedTime.totalMeetings.toLocaleString()}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                                    {localeIsJapan ? '回' : 'times'}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                                    {sharedTime.totalDays}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                                    {localeIsJapan ? '日' : 'days'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Planet selection */}
                <div className="input-group">
                    <label className="input-label">{t('person.planet')}</label>
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
                        gap: '0.5rem', padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px'
                    }}>
                        {PLANET_OPTIONS.map((planet) => (
                            <button
                                key={planet.url}
                                type="button"
                                onClick={() => setFormData({ ...formData, textureUrl: planet.url })}
                                aria-label={t(planet.i18nKey)}
                                aria-pressed={formData.textureUrl === planet.url}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    gap: '0.25rem', padding: '0.5rem 0.25rem',
                                    border: formData.textureUrl === planet.url ? '2px solid #3b82f6' : '2px solid transparent',
                                    borderRadius: '10px',
                                    background: formData.textureUrl === planet.url ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    backgroundImage: `url(${planet.url})`, backgroundSize: 'cover', backgroundPosition: 'center',
                                    boxShadow: formData.textureUrl === planet.url ? '0 0 8px rgba(59, 130, 246, 0.5)' : 'none'
                                }} />
                                <span style={{ fontSize: '0.6rem', color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center' }}>
                                    {t(planet.i18nKey)}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            flex: 1, padding: '0.75rem',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '10px', background: 'transparent',
                            color: 'white', cursor: 'pointer', fontSize: '0.9rem'
                        }}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        className="visualize-btn"
                        style={{ flex: 2, padding: '0.75rem', fontSize: '0.9rem' }}
                    >
                        {person ? t('common.update') : t('common.add')}
                    </button>
                </div>

                {/* Visualize this person */}
                {person && onVisualize && (
                    <button
                        type="button"
                        onClick={() => onVisualize(person.id)}
                        className="visualize-btn"
                        style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', marginTop: '0.75rem' }}
                    >
                        {t('person.visualize')}
                    </button>
                )}

                {/* Delete */}
                {person && onDelete && (
                    <button
                        type="button"
                        onClick={() => {
                            if (confirm(t('person.deleteConfirm'))) {
                                onDelete(person.id);
                            }
                        }}
                        style={{
                            width: '100%', padding: '0.6rem', border: 'none', borderRadius: '10px',
                            background: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e',
                            cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.5rem'
                        }}
                    >
                        {t('person.delete')}
                    </button>
                )}
            </form>
        </section>
    );
};

export default PersonSettings;
export { PLANET_OPTIONS };
