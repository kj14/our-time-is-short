import React, { useState, useEffect } from 'react';

// Sliders for life expectancy, healthy life expectancy, and working age.
// Extracted from the 1202-line Visualization.jsx during the Phase 4.3
// split. Visible inside the settings modal opened from the sun (gear).
const UserSettings = ({ lifeExpectancy, healthyLifeExpectancy, workingAgeLimit, calculationBasis, onCalculationBasisChange, onUpdate }) => {
    const [formData, setFormData] = useState({
        lifeExpectancy: lifeExpectancy.toString(),
        healthyLifeExpectancy: healthyLifeExpectancy.toString(),
        workingAgeLimit: workingAgeLimit.toString()
    });

    useEffect(() => {
        setFormData({
            lifeExpectancy: lifeExpectancy.toString(),
            healthyLifeExpectancy: healthyLifeExpectancy.toString(),
            workingAgeLimit: workingAgeLimit.toString()
        });
    }, [lifeExpectancy, healthyLifeExpectancy, workingAgeLimit]);

    const handleSave = () => {
        onUpdate({
            lifeExpectancy: Number(formData.lifeExpectancy),
            healthyLifeExpectancy: Number(formData.healthyLifeExpectancy),
            workingAgeLimit: Number(formData.workingAgeLimit)
        });
    };

    return (
        <div className="user-settings-section" style={{ marginBottom: '3rem' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', fontWeight: 600 }}>自分の設定</h3>

            {onCalculationBasisChange && (
                <div className="person-form-card" style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 500 }}>計算基準の選択</label>
                    <div className="input-toggle-group" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <BasisBtn active={calculationBasis === 'life'} onClick={() => onCalculationBasisChange('life')} color="rgba(96, 165, 250, 0.2)">残りの人生</BasisBtn>
                        <BasisBtn active={calculationBasis === 'healthy'} onClick={() => onCalculationBasisChange('healthy')} color="rgba(52, 211, 153, 0.2)">健康でいられる時間</BasisBtn>
                        <BasisBtn active={calculationBasis === 'working'} onClick={() => onCalculationBasisChange('working')} color="rgba(251, 191, 36, 0.2)">社会で活躍できる時間</BasisBtn>
                    </div>
                </div>
            )}

            <div className="person-form-card">
                <div className="form-grid">
                    <SliderField
                        label={`Life ${Number(formData.lifeExpectancy).toFixed(1)} years`}
                        value={formData.lifeExpectancy}
                        onChange={(v) => setFormData({ ...formData, lifeExpectancy: v })}
                        min={50} max={100} step={0.1}
                        labelMin="50 years" labelMax="100 years"
                        valueLabel={`${Number(formData.lifeExpectancy).toFixed(1)} years`}
                    />
                    <SliderField
                        label="健康寿命"
                        value={formData.healthyLifeExpectancy}
                        onChange={(v) => setFormData({ ...formData, healthyLifeExpectancy: v })}
                        min={40} max={90} step={0.1}
                        labelMin="40歳" labelMax="90歳"
                        valueLabel={`${Number(formData.healthyLifeExpectancy).toFixed(1)}歳`}
                    />
                    <SliderField
                        label="定年退職年齢"
                        value={formData.workingAgeLimit}
                        onChange={(v) => setFormData({ ...formData, workingAgeLimit: v })}
                        min={50} max={75} step={1}
                        labelMin="50歳" labelMax="75歳"
                        valueLabel={`${Number(formData.workingAgeLimit).toFixed(0)}歳`}
                    />
                </div>

                <div className="form-actions">
                    <button className="btn-primary" onClick={handleSave}>保存</button>
                </div>
            </div>
        </div>
    );
};

const BasisBtn = ({ active, onClick, color, children }) => (
    <button
        className={`toggle-btn ${active ? 'active' : ''}`}
        onClick={onClick}
        style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: active ? color : 'transparent',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            transition: 'all 0.2s'
        }}
    >
        {children}
    </button>
);

const SliderField = ({ label, value, onChange, min, max, step, labelMin, labelMax, valueLabel }) => (
    <div className="form-group">
        <label>{label}</label>
        <div className="slider-container">
            <input
                type="range"
                min={min} max={max} step={step}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="slider"
            />
            <div className="slider-labels">
                <span>{labelMin}</span>
                <span className="slider-value">{valueLabel}</span>
                <span>{labelMax}</span>
            </div>
        </div>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            min={min} max={max} step={step}
            className="form-input"
            style={{ marginTop: '0.5rem' }}
        />
    </div>
);

export default UserSettings;
