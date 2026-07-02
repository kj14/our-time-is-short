import React, { useState } from 'react';
import { useT } from '../i18n';
import type { Language } from '../types';

interface Props {
    userCountry: string;
    currentLang: Language;
    onLanguageChange: (lang: Language) => void;
    onDone: () => void;
}

// First-run intro (CONCEPT §1, §8, §12). Three quiet slides that surface the
// concept without alarm — liberation, not fear; the "what will I think before
// I die?" question is evoked, never stated. Skippable, shown once.
export default function Onboarding({ userCountry, currentLang, onLanguageChange, onDone }: Props) {
    const t = useT(userCountry);
    const [slide, setSlide] = useState(0);

    const slides = [
        { title: t('onboard.1.title'), body: t('onboard.1.body') },
        { title: t('onboard.2.title'), body: t('onboard.2.body') },
        { title: t('onboard.3.title'), body: t('onboard.3.body') }
    ];
    const isLast = slide === slides.length - 1;

    const langBtn = (lang: Language, label: string) => (
        <button
            onClick={() => onLanguageChange(lang)}
            style={{
                background: 'transparent',
                border: 'none',
                color: currentLang === lang ? '#fff' : 'rgba(255,255,255,0.4)',
                fontWeight: currentLang === lang ? 700 : 400,
                fontSize: 'var(--text-sm)',
                cursor: 'pointer',
                padding: '0.25rem 0.4rem'
            }}
            aria-pressed={currentLang === lang}
        >
            {label}
        </button>
    );

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={t('onboard.1.title')}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: 'calc(env(safe-area-inset-top,0px) + 2rem) 1.75rem calc(env(safe-area-inset-bottom,0px) + 2rem)',
                background: 'radial-gradient(ellipse at 50% 35%, #12172e 0%, #05060a 100%)',
                color: '#fff',
                pointerEvents: 'auto'
            }}
        >
            {/* language toggle + skip, top row */}
            <div style={{
                position: 'absolute',
                top: 'calc(env(safe-area-inset-top,0px) + 1rem)',
                left: 0, right: 0,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0 1.25rem'
            }}>
                <div style={{ display: 'flex', gap: '0.15rem' }}>
                    {langBtn('ja', t('lang.ja'))}
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                    {langBtn('en', t('lang.en'))}
                </div>
                <button
                    onClick={onDone}
                    style={{
                        background: 'transparent', border: 'none',
                        color: 'rgba(255,255,255,0.5)', fontSize: 'var(--text-sm)', cursor: 'pointer'
                    }}
                >
                    {t('onboard.skip')}
                </button>
            </div>

            {/* slide content */}
            <div key={slide} style={{ maxWidth: '30rem', animation: 'fadeIn 0.6s ease-out both' }}>
                <h2 style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 700,
                    lineHeight: 1.35,
                    marginBottom: 'var(--space-4)',
                    letterSpacing: '0.01em'
                }}>
                    {slides[slide].title}
                </h2>
                <p style={{
                    fontSize: 'var(--text-lg)',
                    color: 'rgba(255,255,255,0.65)',
                    lineHeight: 1.7
                }}>
                    {slides[slide].body}
                </p>
            </div>

            {/* dots + advance */}
            <div style={{
                position: 'absolute',
                bottom: 'calc(env(safe-area-inset-bottom,0px) + 2.5rem)',
                left: 0, right: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-5)'
            }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {slides.map((_, i) => (
                        <span key={i} style={{
                            width: i === slide ? '20px' : '7px',
                            height: '7px',
                            borderRadius: '99px',
                            background: i === slide ? '#8b5cf6' : 'rgba(255,255,255,0.25)',
                            transition: 'all 0.3s ease'
                        }} />
                    ))}
                </div>
                <button
                    onClick={() => (isLast ? onDone() : setSlide(slide + 1))}
                    className="visualize-btn"
                    style={{ minWidth: '12rem', padding: '0.85rem 2rem' }}
                >
                    {isLast ? t('onboard.begin') : t('onboard.next')}
                </button>
            </div>
        </div>
    );
}
