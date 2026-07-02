import { useEffect, useState } from 'react';

// Tracks the user's OS-level "reduce motion" preference, reactively.
// The scene uses this to slow/stop orbital + starfield motion for users
// with vestibular sensitivity — CSS keyframes are handled separately in
// index.css via the same media query.
export function useReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReduced(mq.matches);
        update();
        // addEventListener is the modern API; older Safari uses addListener.
        if (mq.addEventListener) {
            mq.addEventListener('change', update);
            return () => mq.removeEventListener('change', update);
        } else {
            mq.addListener(update);
            return () => mq.removeListener(update);
        }
    }, []);

    return reduced;
}

// Tracks document visibility so the render loop can pause when the tab is
// hidden — no point burning GPU/CPU animating a scene nobody is looking at.
export function usePageVisible(): boolean {
    const [visible, setVisible] = useState(
        typeof document === 'undefined' ? true : !document.hidden
    );

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const update = () => setVisible(!document.hidden);
        document.addEventListener('visibilitychange', update);
        return () => document.removeEventListener('visibilitychange', update);
    }, []);

    return visible;
}
