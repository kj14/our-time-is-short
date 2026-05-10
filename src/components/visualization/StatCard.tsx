import React from 'react';

const StatCard = ({ label, value, highlight, delay, themeColor }) => (
    <div style={{
        background: highlight ? `linear-gradient(135deg, ${themeColor}22 0%, ${themeColor}11 100%)` : 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '2.5rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: highlight ? `0 10px 30px -10px ${themeColor}40` : '0 4px 20px rgba(0,0,0,0.1)',
        border: highlight ? `1px solid ${themeColor}40` : '1px solid rgba(255, 255, 255, 0.05)',
        color: 'var(--color-text-primary)',
        animation: `fadeIn 0.5s ease-out forwards ${delay}`,
        opacity: 0,
        transform: 'translateY(10px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
    }}>
        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem', opacity: 0.6 }}>
            {label}
        </div>
        <div style={{ fontSize: '2.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '-1px' }}>
            {value}
        </div>
    </div>
);

export default StatCard;
