// Shared SNS-share helpers. Used by the main countdown card
// (Visualization), the detail page, and Truth Messages.
//
// Strategy: Web Share API with file attachment when available (mobile),
// otherwise fall back to opening an X (Twitter) intent URL.

import html2canvas from 'html2canvas';

export const SHARE_HASHTAG = '#OurTimeIsShort';
const APP_URL = 'https://letmeknow.life';

export function buildShareText(t: (key: string, vars?: Record<string, string | number>) => string, remainingYears: number): string {
    return `${t('detail.shareText', { years: remainingYears.toFixed(1) })} ${SHARE_HASHTAG} ${APP_URL}`;
}

export function openXIntent(text: string): void {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
}

// Try to share plain text via the native sheet; fall back to X intent.
export async function shareText(text: string): Promise<void> {
    if (navigator.share) {
        try {
            await navigator.share({ text });
            return;
        } catch (err: any) {
            // AbortError means the user dismissed the sheet — don't fall through.
            if (err && err.name === 'AbortError') return;
        }
    }
    openXIntent(text);
}

// Capture a DOM node to PNG and share it (with text). Falls back to
// text-only share when canvas capture or file-share isn't available.
export async function shareElementSnapshot(element: HTMLElement, text: string): Promise<void> {
    try {
        const canvas = await html2canvas(element, {
            backgroundColor: '#0a0a1a',
            scale: 2,
            logging: false
        });
        const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (blob && navigator.share && navigator.canShare) {
            const file = new File([blob], 'our-time-is-short.png', { type: 'image/png' });
            const data = { files: [file], text };
            if (navigator.canShare(data)) {
                try {
                    await navigator.share(data);
                    return;
                } catch (err: any) {
                    if (err && err.name === 'AbortError') return;
                }
            }
        }
    } catch {
        // html2canvas can fail on tainted canvases etc. — fall through to text.
    }
    await shareText(text);
}
