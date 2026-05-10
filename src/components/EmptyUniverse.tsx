import React from 'react';
import { useT, isJapaneseLanguage } from '../i18n';

interface Props {
    userCountry: string;
}

// Welcome nudge shown to users who have set up their own data but
// haven't added any people yet. Sits below the main visualization.
export default function EmptyUniverse({ userCountry }: Props) {
    const t = useT(userCountry);
    const isJa = isJapaneseLanguage(userCountry);

    return (
        <div
            role="status"
            style={{
                position: 'fixed',
                left: '50%',
                bottom: '8rem',
                transform: 'translateX(-50%)',
                zIndex: 50,
                pointerEvents: 'none',
                maxWidth: 'min(360px, calc(100vw - 2rem))',
                animation: 'fadeIn 0.8s ease-out 0.3s both'
            }}
        >
            <div style={{
                background: 'rgba(15, 23, 42, 0.92)',
                color: '#f5f5f5',
                padding: '1.25rem 1.5rem',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                textAlign: 'center'
            }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '1rem' }}>
                    {t('empty.title')}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {t('empty.subtitle')}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.45)', marginTop: '0.75rem', fontSize: '0.78rem' }}>
                    {isJa ? '右上の太陽（⚙️）から「大切な人を追加」' : 'Tap the sun (⚙️) at top-right to add'}
                </div>
            </div>
        </div>
    );
}
