import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { strings } from '../i18n/strings';
import type { Language } from '../types';

const REPO_URL = 'https://github.com/kj14/our-time-is-short';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

function detectLanguage(): Language {
    try {
        const stored = localStorage.getItem('lifevis_language');
        if (stored === 'ja' || stored === 'en') return stored;
        const country = JSON.parse(localStorage.getItem('lifevis_userData') || 'null')?.country;
        if (country === 'Japan') return 'ja';
    } catch {
        // Ignore — we'll fall back to en.
    }
    return 'en';
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ errorInfo });
        // eslint-disable-next-line no-console
        console.error('Uncaught error:', error, errorInfo);
    }

    handleReload = () => window.location.reload();

    handleResetState = () => {
        const lang = detectLanguage();
        const dict = strings[lang];
        if (!confirm(lang === 'ja'
            ? 'すべての保存データを削除します。この操作は取り消せません。よろしいですか？'
            : 'This will erase all your saved data. This cannot be undone. Continue?')) {
            return;
        }
        try {
            for (const key of Object.keys(localStorage)) {
                if (key.startsWith('lifevis_')) localStorage.removeItem(key);
            }
        } catch {
            // ignore
        }
        window.location.reload();
    };

    handleReport = () => {
        const { error, errorInfo } = this.state;
        const stack = errorInfo?.componentStack ?? '';
        const body = encodeURIComponent(
            `## Error\n\`\`\`\n${error?.toString() ?? ''}\n${stack}\n\`\`\`\n\n## Steps to reproduce\n<!-- describe what you were doing -->\n`
        );
        const title = encodeURIComponent(`[bug] ${error?.message?.slice(0, 80) ?? 'error'}`);
        window.open(`${REPO_URL}/issues/new?title=${title}&body=${body}`, '_blank', 'noopener');
    };

    render() {
        if (!this.state.hasError) return this.props.children;

        const lang = detectLanguage();
        const dict = strings[lang] || strings.en;

        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0a0e1a',
                color: '#f5f5f5',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                padding: '2rem'
            }}>
                <div style={{
                    maxWidth: '480px',
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '16px',
                    padding: '2rem'
                }}>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                        {dict['error.title']}
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem' }}>
                        {dict['error.subtitle']}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <button onClick={this.handleReload} style={primaryBtn}>
                            {dict['error.reload']}
                        </button>
                        <button onClick={this.handleResetState} style={secondaryBtn}>
                            {dict['error.reset']}
                        </button>
                        <button onClick={this.handleReport} style={secondaryBtn}>
                            {dict['error.report']}
                        </button>
                    </div>

                    <details style={{
                        marginTop: '2rem',
                        padding: '1rem',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    }}>
                        <summary style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
                            {lang === 'ja' ? '詳細' : 'Details'}
                        </summary>
                        <div style={{ marginTop: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                            {this.state.error?.toString()}
                            {this.state.errorInfo?.componentStack}
                        </div>
                    </details>
                </div>
            </div>
        );
    }
}

const primaryBtn: React.CSSProperties = {
    padding: '0.85rem 1rem',
    border: 'none',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    color: 'white',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer'
};

const secondaryBtn: React.CSSProperties = {
    padding: '0.75rem 1rem',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '12px',
    background: 'transparent',
    color: 'white',
    fontSize: '0.9rem',
    cursor: 'pointer'
};
