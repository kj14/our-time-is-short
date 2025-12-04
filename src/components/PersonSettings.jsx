import React, { useState, useEffect } from 'react';

// Planet textures with names for selection
const PLANET_OPTIONS = [
    { url: '/textures/2k_mercury.jpg', name: '水星', nameEn: 'Mercury' },
    { url: '/textures/2k_venus_surface.jpg', name: '金星', nameEn: 'Venus' },
    { url: '/textures/2k_mars.jpg', name: '火星', nameEn: 'Mars' },
    { url: '/textures/2k_jupiter.jpg', name: '木星', nameEn: 'Jupiter' },
    { url: '/textures/2k_saturn.jpg', name: '土星', nameEn: 'Saturn' },
    { url: '/textures/2k_uranus.jpg', name: '天王星', nameEn: 'Uranus' },
    { url: '/textures/2k_neptune.jpg', name: '海王星', nameEn: 'Neptune' }
];

const FREQUENCY_OPTIONS = [
    { value: 365, label: '毎日', labelEn: 'Daily' },
    { value: 104, label: '週に2回', labelEn: 'Twice a week' },
    { value: 52, label: '週に1回', labelEn: 'Weekly' },
    { value: 24, label: '月に2回', labelEn: 'Twice a month' },
    { value: 12, label: '月に1回', labelEn: 'Monthly' },
    { value: 4, label: '3ヶ月に1回', labelEn: 'Once a quarter' },
    { value: 1, label: '年に1回', labelEn: 'Once a year' }
];

const HOURS_OPTIONS = [
    { value: 0.5, label: '30分', labelEn: '30 min' },
    { value: 1, label: '1時間', labelEn: '1 hour' },
    { value: 2, label: '2時間', labelEn: '2 hours' },
    { value: 3, label: '3時間', labelEn: '3 hours' },
    { value: 6, label: '半日', labelEn: 'Half day' },
    { value: 24, label: '1日', labelEn: '1 day' }
];

const generateId = () => `person_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const PersonSettings = ({ 
    person, // null for new person, object for editing
    onSave, 
    onDelete, 
    onCancel,
    isJapan = true 
}) => {
    const [formData, setFormData] = useState({
        name: '',
        birthYear: '',
        birthMonth: '',
        birthDay: '',
        age: '',
        meetingFrequency: 12,
        hoursPerMeeting: 2,
        textureUrl: PLANET_OPTIONS[0].url
    });
    const [useAgeInput, setUseAgeInput] = useState(false);

    // Initialize form with person data if editing
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
                textureUrl: person.textureUrl || PLANET_OPTIONS[0].url
            });
        }
    }, [person]);

    // Generate year options
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 121 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const getDaysInMonth = (year, month) => {
        if (!year || !month) return 31;
        return new Date(year, month, 0).getDate();
    };
    const days = Array.from({ length: getDaysInMonth(formData.birthYear, formData.birthMonth) }, (_, i) => i + 1);

    // Calculate age from birthdate
    const calculateAge = () => {
        if (!formData.birthYear || !formData.birthMonth || !formData.birthDay) return null;
        const today = new Date();
        const birthDate = new Date(formData.birthYear, formData.birthMonth - 1, formData.birthDay);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            age--;
        }
        return age;
    };

    const calculatedAge = useAgeInput ? (formData.age ? Number(formData.age) : null) : calculateAge();

    const handleSave = () => {
        if (!formData.name) {
            alert(isJapan ? '名前を入力してください' : 'Please enter a name');
            return;
        }

        const hasBirthdate = formData.birthYear && formData.birthMonth && formData.birthDay;
        const hasAge = formData.age && formData.age !== '';

        if (!hasBirthdate && !hasAge) {
            alert(isJapan ? '生年月日または年齢を入力してください' : 'Please enter birthdate or age');
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
            textureUrl: formData.textureUrl
        };

        onSave(savedPerson);
    };

    return (
        <section className="input-section fade-in" style={{ animationDelay: '0.2s' }}>
            <p className="input-section-tagline">
                {isJapan ? '大切な人との時間を可視化' : 'Visualize time with someone special'}
            </p>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="input-form">
                {/* Name */}
                <div className="input-group">
                    <label className="input-label">
                        {isJapan ? '名前' : 'Name'}
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="select-styled"
                        placeholder={isJapan ? '名前を入力' : 'Enter name'}
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

                {/* Age Input Toggle */}
                <div className="input-group">
                    <div style={{ 
                        display: 'flex', 
                        gap: '0.5rem', 
                        marginBottom: '0.5rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        padding: '4px'
                    }}>
                        <button
                            type="button"
                            onClick={() => setUseAgeInput(false)}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                border: 'none',
                                borderRadius: '6px',
                                background: !useAgeInput ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                transition: 'background 0.2s'
                            }}
                        >
                            {isJapan ? '生年月日' : 'Birthdate'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setUseAgeInput(true)}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                border: 'none',
                                borderRadius: '6px',
                                background: useAgeInput ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                transition: 'background 0.2s'
                            }}
                        >
                            {isJapan ? '年齢' : 'Age'}
                        </button>
                    </div>

                    {useAgeInput ? (
                        <input
                            type="number"
                            value={formData.age}
                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                            className="select-styled"
                            placeholder={isJapan ? '年齢を入力' : 'Enter age'}
                            min="0"
                            max="120"
                            style={{ 
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                padding: '1rem',
                                borderRadius: '12px',
                                fontSize: '1rem'
                            }}
                        />
                    ) : (
                        <div className="date-grid">
                            <select
                                value={formData.birthYear}
                                onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                                className="select-styled"
                            >
                                <option value="">{isJapan ? '年' : 'Year'}</option>
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <select
                                value={formData.birthMonth}
                                onChange={(e) => setFormData({ ...formData, birthMonth: e.target.value })}
                                className="select-styled"
                            >
                                <option value="">{isJapan ? '月' : 'Month'}</option>
                                {months.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            <select
                                value={formData.birthDay}
                                onChange={(e) => setFormData({ ...formData, birthDay: e.target.value })}
                                className="select-styled"
                            >
                                <option value="">{isJapan ? '日' : 'Day'}</option>
                                {days.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {calculatedAge !== null && (
                        <div className="age-display">
                            {calculatedAge} {isJapan ? '歳' : 'years old'}
                        </div>
                    )}
                </div>

                {/* Meeting Frequency */}
                <div className="input-group">
                    <label className="input-label">
                        {isJapan ? '会う頻度' : 'Meeting Frequency'}
                    </label>
                    <select
                        value={formData.meetingFrequency}
                        onChange={(e) => setFormData({ ...formData, meetingFrequency: Number(e.target.value) })}
                        className="select-styled"
                    >
                        {FREQUENCY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {isJapan ? opt.label : opt.labelEn}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Hours Per Meeting */}
                <div className="input-group">
                    <label className="input-label">
                        {isJapan ? '1回あたりの時間' : 'Hours Per Meeting'}
                    </label>
                    <select
                        value={formData.hoursPerMeeting}
                        onChange={(e) => setFormData({ ...formData, hoursPerMeeting: Number(e.target.value) })}
                        className="select-styled"
                    >
                        {HOURS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {isJapan ? opt.label : opt.labelEn}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Planet (Texture) Selection */}
                <div className="input-group">
                    <label className="input-label">
                        {isJapan ? '星を選択' : 'Select Planet'}
                    </label>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '0.75rem',
                        padding: '1rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '12px'
                    }}>
                        {PLANET_OPTIONS.map((planet) => (
                            <button
                                key={planet.url}
                                type="button"
                                onClick={() => setFormData({ ...formData, textureUrl: planet.url })}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 0.5rem',
                                    border: formData.textureUrl === planet.url 
                                        ? '2px solid #3b82f6' 
                                        : '2px solid transparent',
                                    borderRadius: '12px',
                                    background: formData.textureUrl === planet.url 
                                        ? 'rgba(59, 130, 246, 0.2)' 
                                        : 'rgba(255, 255, 255, 0.05)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundImage: `url(${planet.url})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    boxShadow: formData.textureUrl === planet.url 
                                        ? '0 0 10px rgba(59, 130, 246, 0.5)' 
                                        : 'none'
                                }} />
                                <span style={{
                                    fontSize: '0.7rem',
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    textAlign: 'center'
                                }}>
                                    {isJapan ? planet.name : planet.nameEn}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button 
                        type="button" 
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '12px',
                            background: 'transparent',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        {isJapan ? 'キャンセル' : 'Cancel'}
                    </button>
                    <button 
                        type="submit" 
                        className="visualize-btn"
                        style={{ flex: 2 }}
                    >
                        {person ? (isJapan ? '更新する' : 'Update') : (isJapan ? '追加する' : 'Add')}
                    </button>
                </div>

                {/* Delete Button (only for editing) */}
                {person && onDelete && (
                    <button 
                        type="button"
                        onClick={() => onDelete(person.id)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: 'none',
                            borderRadius: '12px',
                            background: 'rgba(244, 63, 94, 0.2)',
                            color: '#f43f5e',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            marginTop: '0.5rem'
                        }}
                    >
                        {isJapan ? 'この人を削除' : 'Delete this person'}
                    </button>
                )}
            </form>
        </section>
    );
};

export default PersonSettings;
export { PLANET_OPTIONS };

