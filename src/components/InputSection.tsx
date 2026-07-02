import React, { useState, useEffect } from 'react';
import { COUNTRIES, translations } from '../utils/lifeData';
import { calculateAge } from '../utils/calculations';
import { useT, isJapaneseLanguage } from '../i18n';
import { safeGet, safeSet } from '../utils/storage';

const InputSection = ({ onVisualize, onCountryChange }) => {
    const [country, setCountry] = useState(() => {
        return safeGet('lifevis_country') || 'Japan';
    });
    // Birthdate starts empty for first-time visitors (no misleading prefill);
    // returning users get their last-entered value back from storage.
    const [year, setYear] = useState(() => safeGet('lifevis_year') || '');
    const [month, setMonth] = useState(() => safeGet('lifevis_month') || '');
    const [day, setDay] = useState(() => safeGet('lifevis_day') || '');
    const [calculatedAge, setCalculatedAge] = useState<number | null>(null);

    const t = useT(country);
    const legacy = translations[country] || translations['default'];
    const isJapan = isJapaneseLanguage(country);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 121 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const getDaysInMonth = (y, m) => {
        if (!y || !m) return 31;
        return new Date(y, m, 0).getDate();
    };

    const days = Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1);

    useEffect(() => {
        if (country) safeSet('lifevis_country', country);
    }, [country]);

    useEffect(() => {
        if (year) safeSet('lifevis_year', year);
    }, [year]);

    useEffect(() => {
        if (month) safeSet('lifevis_month', month);
    }, [month]);

    useEffect(() => {
        if (day) safeSet('lifevis_day', day);
    }, [day]);

    useEffect(() => {
        const age = calculateAge({ birthYear: Number(year), birthMonth: Number(month), birthDay: Number(day) });
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
                {legacy.tagline}
            </p>
            <form onSubmit={handleSubmit} className="input-form">
                <div className="input-group">
                    <label className="input-label">
                        {t('input.country')}
                    </label>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={country}
                            onChange={handleCountryChange}
                            className="select-styled"
                            aria-label={t('input.country')}
                        >
                            {[...COUNTRIES]
                                .sort((a, b) => (isJapan ? a.nameJa.localeCompare(b.nameJa, 'ja') : a.nameEn.localeCompare(b.nameEn)))
                                .map(c => (
                                    <option key={c.key} value={c.key}>{isJapan ? c.nameJa : c.nameEn}</option>
                                ))}
                        </select>
                    </div>
                </div>

                <div className="input-group">
                    <label className="input-label">
                        {t('input.birthDate')}
                    </label>

                    <div className="date-grid">
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="select-styled"
                            aria-label={t('input.year')}
                        >
                            <option value="">{t('input.year')}</option>
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>

                        <select
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="select-styled"
                            aria-label={t('input.month')}
                        >
                            <option value="">{t('input.month')}</option>
                            {months.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>

                        <select
                            value={day}
                            onChange={(e) => setDay(e.target.value)}
                            className="select-styled"
                            aria-label={t('input.day')}
                        >
                            <option value="">{t('input.day')}</option>
                            {days.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    {calculatedAge !== null && (
                        <div className="age-display">
                            {calculatedAge.toFixed(1)} {t('input.ageUnit')}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="visualize-btn"
                    disabled={calculatedAge === null}
                    aria-disabled={calculatedAge === null}
                    style={calculatedAge === null ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                >
                    {legacy.visualize}
                </button>
            </form>
        </section>
    );
};

export default InputSection;
