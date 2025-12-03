import React, { useState, useEffect } from 'react';
import { lifeExpectancyData, translations } from '../utils/lifeData';

const InputSection = ({ onVisualize, onCountryChange }) => {
    // Load from localStorage or use defaults
    const [country, setCountry] = useState(() => {
        return localStorage.getItem('lifevis_country') || 'Japan';
    });
    const [year, setYear] = useState(() => {
        return localStorage.getItem('lifevis_year') || '1980';
    });
    const [month, setMonth] = useState(() => {
        return localStorage.getItem('lifevis_month') || '1';
    });
    const [day, setDay] = useState(() => {
        return localStorage.getItem('lifevis_day') || '14';
    });
    const [calculatedAge, setCalculatedAge] = useState(null);

    const t = translations[country] || translations['default'];

    // Generate year options (current year - 120 to current year)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 121 }, (_, i) => currentYear - i);

    // Generate month options
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    // Generate day options based on selected month and year
    const getDaysInMonth = (year, month) => {
        if (!year || !month) return 31;
        return new Date(year, month, 0).getDate();
    };

    const days = Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1);

    // Calculate age from birthdate
    const calculateAge = (y, m, d) => {
        if (!y || !m || !d) return null;
        const today = new Date();
        const birthDate = new Date(y, m - 1, d);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();

        // Adjust for month and day
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            age--;
        }

        // Calculate precise age with decimals
        const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        if (nextBirthday < today) {
            nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        const lastBirthday = new Date(nextBirthday);
        lastBirthday.setFullYear(nextBirthday.getFullYear() - 1);

        const yearProgress = (today - lastBirthday) / (nextBirthday - lastBirthday);
        const preciseAge = age + yearProgress;

        return preciseAge;
    };

    // Save to localStorage whenever values change
    useEffect(() => {
        if (country) localStorage.setItem('lifevis_country', country);
    }, [country]);

    useEffect(() => {
        if (year) localStorage.setItem('lifevis_year', year);
    }, [year]);

    useEffect(() => {
        if (month) localStorage.setItem('lifevis_month', month);
    }, [month]);

    useEffect(() => {
        if (day) localStorage.setItem('lifevis_day', day);
    }, [day]);

    // Update age when any date component changes
    useEffect(() => {
        const age = calculateAge(year, month, day);
        setCalculatedAge(age);
    }, [year, month, day]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (calculatedAge !== null) {
            onVisualize(country, calculatedAge);
        }
    };

    const handleCountryChange = (e) => {
        const newCountry = e.target.value;
        setCountry(newCountry);
        if (onCountryChange) {
            onCountryChange(newCountry);
        }
    };

    return (
        <section className="input-section fade-in" style={{ animationDelay: '0.2s' }}>
            <p className="input-section-tagline">
                {t.tagline}
            </p>
            <form onSubmit={handleSubmit} className="input-form">
                <div className="input-group">
                    <label className="input-label">
                        {t.whereLive}
                    </label>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={country}
                            onChange={handleCountryChange}
                            className="select-styled"
                        >
                            {Object.keys(lifeExpectancyData).sort().map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="input-group">
                    <label className="input-label">
                        {t.birthdate || '生年月日'}
                    </label>

                    <div className="date-grid">
                        {/* Year */}
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="select-styled"
                        >
                            <option value="">年</option>
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>

                        {/* Month */}
                        <select
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="select-styled"
                        >
                            <option value="">月</option>
                            {months.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>

                        {/* Day */}
                        <select
                            value={day}
                            onChange={(e) => setDay(e.target.value)}
                            className="select-styled"
                        >
                            <option value="">日</option>
                            {days.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    {calculatedAge !== null && (
                        <div className="age-display">
                            {calculatedAge.toFixed(1)} 歳
                        </div>
                    )}
                </div>

                <button type="submit" className="visualize-btn">
                    {t.visualize}
                </button>
            </form>
        </section>
    );
};

export default InputSection;
