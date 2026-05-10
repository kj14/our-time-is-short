import React, { useEffect, useState, useCallback } from 'react';
import { pickTruthMessage, buildContext } from './selector';
import { useT, isJapaneseLanguage } from '../../i18n';
import { getLifeExpectancy } from '../../utils/calculations';

const MAX_HISTORY = 8;

export default function TruthMessage({ user, people, basis = 'life' }) {
    const t = useT(user?.country);
    const isJa = isJapaneseLanguage(user?.country);
    const [message, setMessage] = useState(null);
    const [history, setHistory] = useState([]);

    const reroll = useCallback(() => {
        if (!user || !user.country || user.age == null) {
            setMessage(null);
            return;
        }
        const ctx = buildContext({
            user,
            people,
            basis,
            userLifeExpectancy: getLifeExpectancy(user.country, basis)
        });
        const next = pickTruthMessage(ctx, history);
        if (next) {
            setMessage(next);
            setHistory((h) => [...h.slice(-MAX_HISTORY + 1), next.id]);
        } else {
            setMessage(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, people, basis]);

    // Re-roll on mount and whenever the universe changes (people count, user).
    useEffect(() => {
        reroll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.country, user?.age, people.length, basis]);

    if (!user || user.age == null) {
        return null;
    }

    if (!message) {
        return (
            <div style={{
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
                padding: '2rem',
                fontSize: '0.95rem'
            }}>
                {t('viz.empty')}
            </div>
        );
    }

    const q = isJa ? message.question.ja : message.question.en;
    const a = isJa ? message.answer.ja : message.answer.en;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            padding: '2rem 1.5rem'
        }}>
            <button
                type="button"
                onClick={reroll}
                aria-label={t('viz.shuffle')}
                style={{
                    padding: '0 0',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    maxWidth: '500px'
                }}
            >
                <div
                    className="truth-message-card"
                    style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: 'var(--radius-lg, 16px)',
                        padding: '2rem 1.5rem',
                        animation: 'fadeIn 0.5s ease-out',
                        textAlign: 'center'
                    }}
                >
                    <div style={{
                        fontSize: '0.7rem',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: 'rgba(255, 255, 255, 0.4)',
                        marginBottom: '0.75rem'
                    }}>
                        Q
                    </div>
                    <div style={{
                        fontSize: '1.15rem',
                        fontWeight: 500,
                        lineHeight: 1.6,
                        color: 'var(--color-text-primary, #f5f5f5)',
                        marginBottom: '2rem'
                    }}>
                        {q}
                    </div>
                    <div style={{
                        height: '1px',
                        width: '40px',
                        margin: '0 auto 1.5rem',
                        background: 'rgba(255, 255, 255, 0.2)'
                    }} />
                    <div style={{
                        fontSize: '0.7rem',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: 'rgba(96, 165, 250, 0.6)',
                        marginBottom: '0.75rem'
                    }}>
                        A
                    </div>
                    <div style={{
                        fontSize: '1.05rem',
                        lineHeight: 1.7,
                        color: '#60a5fa',
                        fontWeight: 600
                    }}>
                        {a}
                    </div>
                </div>
            </button>
            <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.4)'
            }}>
                {isJa ? 'タップで別のメッセージ' : 'Tap for another message'}
            </div>
        </div>
    );
}
