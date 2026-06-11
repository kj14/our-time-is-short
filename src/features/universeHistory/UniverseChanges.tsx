// "Universe Changes" panel — CONCEPT.md §11 Visualizing Change.
// Renders the diff between today's universe and the snapshot closest to
// one year ago: who appeared, who faded, whose shared time grew or
// shrank, and whether the mentor changed. Hidden until enough history
// has accumulated (~25 days), so fresh installs see nothing.

import React, { useMemo } from 'react';
import { useT } from '../../i18n';
import {
    loadSnapshots,
    findComparisonSnapshot,
    diffUniverse,
    hasAnyChange
} from './snapshots';
import type { Person } from '../../types';

interface Props {
    people: Person[];
    userCountry: string;
}

const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    background: 'rgba(255, 255, 255, 0.04)',
    borderRadius: '10px',
    fontSize: '0.9rem'
};

export default function UniverseChanges({ people, userCountry }: Props) {
    const t = useT(userCountry);

    const diff = useMemo(() => {
        const snapshots = loadSnapshots();
        const base = findComparisonSnapshot(snapshots);
        if (!base) return null;
        return diffUniverse(base, people);
    }, [people]);

    if (!diff || !hasAnyChange(diff)) return null;

    const months = Math.max(1, Math.round(diff.daysBetween / 30));

    return (
        <div style={{ marginBottom: '4rem' }}>
            <h3 style={{
                marginBottom: '0.5rem',
                textAlign: 'center',
                fontSize: '1.5rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                opacity: 0.8
            }}>
                {t('history.title')}
            </h3>
            <div style={{
                textAlign: 'center',
                fontSize: '0.8rem',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '1.5rem'
            }}>
                {t('history.subtitle', { months })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {diff.appeared.map((p) => (
                    <div key={`a-${p.id}`} style={{ ...rowStyle, border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                        <span>✨ {p.name}</span>
                        <span style={{ color: '#34d399', fontSize: '0.8rem' }}>{t('history.appeared')}</span>
                    </div>
                ))}
                {diff.faded.map((p) => (
                    <div key={`f-${p.id}`} style={{ ...rowStyle, border: '1px solid rgba(148, 163, 184, 0.3)', opacity: 0.75 }}>
                        <span>🌫 {p.name}</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{t('history.faded')}</span>
                    </div>
                ))}
                {diff.increased.map((c) => (
                    <div key={`i-${c.id}`} style={{ ...rowStyle, border: '1px solid rgba(96, 165, 250, 0.3)' }}>
                        <span>↑ {c.name}</span>
                        <span style={{ color: '#60a5fa', fontSize: '0.8rem' }}>
                            {t('history.hoursPerYear', { before: Math.round(c.beforeHoursPerYear), after: Math.round(c.afterHoursPerYear) })}
                        </span>
                    </div>
                ))}
                {diff.decreased.map((c) => (
                    <div key={`d-${c.id}`} style={{ ...rowStyle, border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                        <span>↓ {c.name}</span>
                        <span style={{ color: '#fbbf24', fontSize: '0.8rem' }}>
                            {t('history.hoursPerYear', { before: Math.round(c.beforeHoursPerYear), after: Math.round(c.afterHoursPerYear) })}
                        </span>
                    </div>
                ))}
                {diff.mentorChanged && (
                    <div style={{ ...rowStyle, border: '1px solid rgba(252, 211, 77, 0.4)' }}>
                        <span>★ {t('history.mentorChanged')}</span>
                        <span style={{ color: '#fcd34d', fontSize: '0.8rem' }}>
                            {diff.mentorChanged.before ?? '—'} → {diff.mentorChanged.after ?? '—'}
                        </span>
                    </div>
                )}
            </div>

            <div style={{
                textAlign: 'center',
                marginTop: '1.25rem',
                fontSize: '0.8rem',
                color: 'rgba(255,255,255,0.45)',
                fontStyle: 'italic'
            }}>
                {t('history.footer')}
            </div>
        </div>
    );
}
