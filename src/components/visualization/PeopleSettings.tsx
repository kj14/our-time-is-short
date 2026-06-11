import React, { useState, useEffect } from 'react';
import { calculateAge } from '../../utils/calculations';
import { lifeExpectancyData } from '../../utils/lifeData';
import { useT } from '../../i18n';
import { generateId } from './helpers';

const PeopleSettings = ({ people, setPeople, userAge, userCountry, remainingYears, editingPersonId, onEditComplete }: any) => {
    const t = useT(userCountry);
    const [editingId, setEditingId] = useState(editingPersonId || null);
    const [useAgeInput, setUseAgeInput] = useState(false);
    
    // When editingPersonId prop changes, update editingId and form
    useEffect(() => {
        if (editingPersonId) {
            const person = people.find(p => p.id === editingPersonId);
            if (person) {
                setEditingId(person.id);
                const hasAge = person.age !== undefined && person.age !== null;
                setUseAgeInput(hasAge || (!person.birthYear && !person.birthMonth && !person.birthDay));
                setFormData({
                    name: person.name,
                    birthYear: person.birthYear ? person.birthYear.toString() : '',
                    birthMonth: person.birthMonth ? person.birthMonth.toString() : '',
                    birthDay: person.birthDay ? person.birthDay.toString() : '',
                    age: person.age !== undefined && person.age !== null ? person.age.toString() : '',
                    meetingFrequency: person.meetingFrequency,
                    hoursPerMeeting: person.hoursPerMeeting,
                    color: person.color
                });
            }
        } else {
            setEditingId(null);
        }
    }, [editingPersonId, people]);
    const [formData, setFormData] = useState({
        name: '',
        birthYear: '',
        birthMonth: '',
        birthDay: '',
        age: '',
        meetingFrequency: 12,
        hoursPerMeeting: 3,
        color: '#818cf8'
    });

    const colors = ['#818cf8', '#f472b6', '#fb7185', '#38bdf8', '#34d399', '#fbbf24', '#a78bfa', '#60a5fa'];

    const handleAdd = () => {
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
        
        const newPerson = {
            id: generateId(),
            name: formData.name,
            ...(hasBirthdate ? {
                birthYear: Number(formData.birthYear),
                birthMonth: Number(formData.birthMonth),
                birthDay: Number(formData.birthDay)
            } : {}),
            ...(hasAge ? { age: Number(formData.age) } : {}),
            meetingFrequency: Number(formData.meetingFrequency),
            hoursPerMeeting: Number(formData.hoursPerMeeting),
            color: formData.color
        };
        
        setPeople([...people, newPerson]);
        setFormData({
            name: '',
            birthYear: '',
            birthMonth: '',
            birthDay: '',
            age: '',
            meetingFrequency: 12,
            hoursPerMeeting: 3,
            color: colors[people.length % colors.length]
        });
        setUseAgeInput(false);
    };

    const handleEdit = (person) => {
        setEditingId(person.id);
        const hasAge = person.age !== undefined && person.age !== null;
        setUseAgeInput(hasAge || (!person.birthYear && !person.birthMonth && !person.birthDay));
        setFormData({
            name: person.name,
            birthYear: person.birthYear ? person.birthYear.toString() : '',
            birthMonth: person.birthMonth ? person.birthMonth.toString() : '',
            birthDay: person.birthDay ? person.birthDay.toString() : '',
            age: person.age !== undefined && person.age !== null ? person.age.toString() : '',
            meetingFrequency: person.meetingFrequency,
            hoursPerMeeting: person.hoursPerMeeting,
            color: person.color
        });
    };

    const handleUpdate = () => {
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
        
        setPeople(people.map(p => 
            p.id === editingId 
                ? {
                    ...p,
                    name: formData.name,
                    ...(hasBirthdate ? {
                        birthYear: Number(formData.birthYear),
                        birthMonth: Number(formData.birthMonth),
                        birthDay: Number(formData.birthDay),
                        age: undefined
                    } : {}),
                    ...(hasAge ? { 
                        age: Number(formData.age),
                        birthYear: undefined,
                        birthMonth: undefined,
                        birthDay: undefined
                    } : {}),
                    meetingFrequency: Number(formData.meetingFrequency),
                    hoursPerMeeting: Number(formData.hoursPerMeeting),
                    color: formData.color
                }
                : p
        ));
        setEditingId(null);
        setFormData({
            name: '',
            birthYear: '',
            birthMonth: '',
            birthDay: '',
            age: '',
            meetingFrequency: 12,
            hoursPerMeeting: 3,
            color: colors[people.length % colors.length]
        });
        setUseAgeInput(false);
        if (onEditComplete) onEditComplete();
    };

    const handleDelete = (id) => {
        if (window.confirm(t('people.deleteConfirmTarget'))) {
            setPeople(people.filter(p => p.id !== id));
        }
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 121 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const getDaysInMonth = (year, month) => {
        if (!year || !month) return 31;
        return new Date(year, month, 0).getDate();
    };

    const days = Array.from({ length: getDaysInMonth(formData.birthYear, formData.birthMonth) }, (_, i) => i + 1);

    return (
        <div className="people-settings">
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', fontWeight: 600 }}>{t('people.title')}</h3>
            
            {/* Add New Person Form */}
            <div className="person-form-card">
                <h4 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}>
                    {editingId ? t('people.edit') : t('people.addNew')}
                </h4>
                
                <div className="form-grid">
                    <div className="form-group">
                        <label>{t('person.name')}</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder={t('person.namePlaceholder')}
                            className="form-input"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>{t('people.ageInputMethod')}</label>
                        <div className="age-input-toggle">
                            <button
                                type="button"
                                className={`toggle-btn ${!useAgeInput ? 'active' : ''}`}
                                onClick={() => setUseAgeInput(false)}
                            >
                                {t('input.birthDate')}
                            </button>
                            <button
                                type="button"
                                className={`toggle-btn ${useAgeInput ? 'active' : ''}`}
                                onClick={() => setUseAgeInput(true)}
                            >
                                {t('person.age')}
                            </button>
                        </div>
                    </div>
                    
                    {!useAgeInput ? (
                        <div className="form-group">
                            <label>{t('input.birthDate')}</label>
                            <div className="date-inputs">
                                <select
                                    value={formData.birthYear}
                                    onChange={(e) => setFormData({...formData, birthYear: e.target.value, age: ''})}
                                    className="form-select"
                                >
                                    <option value="">{t('input.year')}</option>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <select
                                    value={formData.birthMonth}
                                    onChange={(e) => setFormData({...formData, birthMonth: e.target.value})}
                                    className="form-select"
                                >
                                    <option value="">{t('input.month')}</option>
                                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <select
                                    value={formData.birthDay}
                                    onChange={(e) => setFormData({...formData, birthDay: e.target.value})}
                                    className="form-select"
                                >
                                    <option value="">{t('input.day')}</option>
                                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="form-group">
                            <label>{t('person.age')}</label>
                            <input
                                type="number"
                                value={formData.age}
                                onChange={(e) => setFormData({...formData, age: e.target.value, birthYear: '', birthMonth: '', birthDay: ''})}
                                min="0"
                                max="150"
                                step="0.1"
                                placeholder={t('person.agePlaceholder')}
                                className="form-input"
                            />
                            <span className="form-hint">{t('input.ageUnit')}</span>
                        </div>
                    )}
                    
                    <div className="form-group">
                        <label>{t('person.frequency')}</label>
                        <div className="frequency-presets">
                            {[
                                { key: 'freq.daily', value: 365 },
                                { key: 'freq.weekly', value: 52 },
                                { key: 'freq.twiceWeek', value: 104 },
                                { key: 'freq.monthly', value: 12 },
                                { key: 'freq.twiceMonth', value: 24 },
                                { key: 'freq.yearly', value: 1 }
                            ].map(preset => (
                                <button
                                    key={preset.value}
                                    type="button"
                                    className={`preset-btn ${formData.meetingFrequency == preset.value ? 'active' : ''}`}
                                    onClick={() => setFormData({...formData, meetingFrequency: preset.value})}
                                >
                                    {t(preset.key)}
                                </button>
                            ))}
                        </div>
                        <div className="slider-container">
                            <input
                                type="range"
                                min="1"
                                max="365"
                                value={formData.meetingFrequency}
                                onChange={(e) => setFormData({...formData, meetingFrequency: Number(e.target.value)})}
                                className="slider"
                            />
                            <div className="slider-labels">
                                <span>{t('people.timesPerYearShort', { n: 1 })}</span>
                                <span className="slider-value">{t('people.timesPerYearShort', { n: formData.meetingFrequency })}</span>
                                <span>{t('people.timesPerYearShort', { n: 365 })}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>{t('person.hoursPerMeeting')}</label>
                        <div className="hours-presets">
                            {[
                                { key: 'hours.30min', value: 0.5 },
                                { key: 'hours.1h', value: 1 },
                                { key: 'hours.2h', value: 2 },
                                { key: 'hours.3h', value: 3 },
                                { key: 'hours.halfDay', value: 6 },
                                { key: 'hours.fullDay', value: 24 }
                            ].map(preset => (
                                <button
                                    key={preset.value}
                                    type="button"
                                    className={`preset-btn ${formData.hoursPerMeeting == preset.value ? 'active' : ''}`}
                                    onClick={() => setFormData({...formData, hoursPerMeeting: preset.value})}
                                >
                                    {t(preset.key)}
                                </button>
                            ))}
                        </div>
                        <div className="slider-container">
                            <input
                                type="range"
                                min="0.5"
                                max="24"
                                step="0.5"
                                value={formData.hoursPerMeeting}
                                onChange={(e) => setFormData({...formData, hoursPerMeeting: Number(e.target.value)})}
                                className="slider"
                            />
                            <div className="slider-labels">
                                <span>0.5{t('unit.hours')}</span>
                                <span className="slider-value">{formData.hoursPerMeeting}{t('unit.hours')}</span>
                                <span>24{t('unit.hours')}</span>
                            </div>
                        </div>
                        {/* Real-time calculation preview */}
                        {(() => {
                            // Calculate age from form data
                            let personAge: number | null = null;
                            if (formData.age && formData.age !== '') {
                                personAge = Number(formData.age);
                            } else if (formData.birthYear && formData.birthMonth && formData.birthDay) {
                                const birthDate = new Date(Number(formData.birthYear), Number(formData.birthMonth) - 1, Number(formData.birthDay));
                                const today = new Date();
                                let age = today.getFullYear() - birthDate.getFullYear();
                                const monthDiff = today.getMonth() - birthDate.getMonth();
                                const dayDiff = today.getDate() - birthDate.getDate();
                                if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                                    age--;
                                }
                                personAge = age;
                            }
                            
                            if (personAge === null) return null;
                            
                            const userLifeExpectancy = lifeExpectancyData[userCountry] || lifeExpectancyData['Global'];
                            const personLifeExpectancy = userLifeExpectancy;
                            let limitLifeExpectancy;
                            if (personAge < userAge) {
                                limitLifeExpectancy = userLifeExpectancy;
                            } else {
                                limitLifeExpectancy = personLifeExpectancy;
                            }
                            const yearsWithPerson = Math.max(0, limitLifeExpectancy - personAge);
                            const effectiveYears = Math.min(yearsWithPerson, remainingYears);
                            const totalMeetings = effectiveYears * formData.meetingFrequency;
                            const totalHours = totalMeetings * formData.hoursPerMeeting;
                            
                            return (
                                <div className="calculation-preview">
                                    <div className="preview-item">
                                        <span>{t('people.meetingsCount')}:</span>
                                        <strong>{totalMeetings.toFixed(0)}{t('unit.times')}</strong>
                                    </div>
                                    <div className="preview-item">
                                        <span>{t('people.sharedHours')}:</span>
                                        <strong>{totalHours.toFixed(0)}{t('unit.hours')}</strong>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                    
                    <div className="form-group">
                        <label>{t('people.colorLabel')}</label>
                        <div className="color-picker">
                            {colors.map(color => (
                                <button
                                    key={color}
                                    className={`color-option ${formData.color === color ? 'active' : ''}`}
                                    style={{ background: color }}
                                    onClick={() => setFormData({...formData, color})}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="form-actions">
                    {editingId ? (
                        <>
                            <button className="btn-secondary" onClick={() => {
                                setEditingId(null);
                                setFormData({
                                    name: '',
                                    birthYear: '',
                                    birthMonth: '',
                                    birthDay: '',
                                    age: '',
                                    meetingFrequency: 12,
                                    hoursPerMeeting: 3,
                                    color: colors[people.length % colors.length]
                                });
                                setUseAgeInput(false);
                            }}>
                                {t('common.cancel')}
                            </button>
                            <button className="btn-primary" onClick={handleUpdate}>
                                {t('common.update')}
                            </button>
                        </>
                    ) : (
                        <button className="btn-primary" onClick={handleAdd}>
                            ＋ {t('common.add')}
                        </button>
                    )}
                </div>
            </div>

            {/* People List */}
            <div className="people-list">
                {people.length === 0 ? (
                    <div className="empty-state">
                        <p>{t('people.empty')}</p>
                        <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.5rem' }}>
                            {t('people.addFromForm')}
                        </p>
                    </div>
                ) : (
                    people.map(person => {
                        const personAge = calculateAge(person);
                        if (personAge === null) return null;
                        
                        // 対象が自分より若い場合 → 自分の平均寿命をリミットとして使用
                        // 対象が自分より年上の場合 → 対象の平均寿命をリミットとして使用
                        const userLifeExpectancy = lifeExpectancyData[userCountry] || lifeExpectancyData['Global'];
                        const personLifeExpectancy = userLifeExpectancy; // 同じ国の平均寿命を使用（男女の平均）
                        
                        let limitLifeExpectancy;
                        if (personAge < userAge) {
                            // 対象が自分より若い場合（例：息子）→ 自分の平均寿命をリミット
                            limitLifeExpectancy = userLifeExpectancy;
                        } else {
                            // 対象が自分より年上の場合（例：親）→ 対象の平均寿命をリミット
                            limitLifeExpectancy = personLifeExpectancy;
                        }
                        
                        const yearsWithPerson = Math.max(0, limitLifeExpectancy - personAge);
                        const effectiveYears = Math.min(yearsWithPerson, remainingYears);
                        const totalMeetings = effectiveYears * person.meetingFrequency;
                        const totalHours = totalMeetings * person.hoursPerMeeting;
                        
                        return (
                            <div 
                                key={person.id} 
                                className="person-card clickable"
                                onClick={() => handleEdit(person)}
                            >
                                <div className="person-card-header">
                                    <div className="person-info">
                                        <div className="person-color" style={{ background: person.color }}></div>
                                        <div>
                                            <div className="person-name">{person.name}</div>
                                            <div className="person-age">
                                                {personAge ? `${personAge.toFixed(1)}${t('input.ageUnit')}` : t('people.ageUnknown')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="person-actions" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                            className="btn-icon"
                                            onClick={() => handleEdit(person)}
                                            aria-label={t('people.edit')}
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            className="btn-icon btn-danger"
                                            onClick={() => handleDelete(person.id)}
                                            aria-label={t('common.delete')}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="person-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">{t('people.meetingsCount')}</span>
                                        <span className="stat-value">{totalMeetings.toFixed(0)}{t('unit.times')}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">{t('people.sharedHours')}</span>
                                        <span className="stat-value">{totalHours.toFixed(0)}{t('unit.hours')}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">{t('common.settings')}</span>
                                        <span className="stat-value">
                                            {t('people.timesPerYearShort', { n: person.meetingFrequency })} × {person.hoursPerMeeting}{t('unit.hours')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default PeopleSettings;
