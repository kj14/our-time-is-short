import React from 'react';

const TimeUnit = ({ value, label, isWide = false, isSmall = false }) => (
    <div style={{ display: 'flex', alignItems: 'baseline', margin: '0 0.5rem', gap: '0.3rem' }}>
        <span style={{
            fontSize: isSmall
                ? 'clamp(1rem, 2vw, 1.2rem)'
                : 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: isSmall ? 300 : 200,
            fontFamily: 'var(--font-mono)',
            lineHeight: 1,
            minWidth: isWide ? '3ch' : '2ch',
            textAlign: 'center',
            display: 'inline-block',
            textShadow: '0 0 30px rgba(255, 255, 255, 0.1)'
        }}>{value}</span>
        <span style={{
            fontSize: isSmall
                ? 'clamp(0.5rem, 1vw, 0.6rem)'
                : 'clamp(0.7rem, 2vw, 0.8rem)',
            textTransform: 'uppercase',
            opacity: 0.4,
            fontWeight: 500,
            letterSpacing: '0.2em'
        }}>{label}</span>
    </div>
);

export default TimeUnit;
