// WebGL capability detection.
//
// The entire visual layer is a Three.js <Canvas>. On devices/browsers where
// WebGL is unavailable or disabled (older devices, hardened browsers, GPU
// blocklists, lost context), react-three-fiber throws during render and the
// whole app falls to the error boundary. We detect support up front so the
// scene can render a calm static fallback instead of crashing — the countdown
// and the rest of the DOM UI remain fully usable without 3D.

let cached: boolean | null = null;

export function isWebGLAvailable(): boolean {
    if (cached !== null) return cached;
    try {
        const canvas = document.createElement('canvas');
        const gl =
            canvas.getContext('webgl') ||
            canvas.getContext('experimental-webgl');
        cached = !!(window.WebGLRenderingContext && gl);
    } catch {
        cached = false;
    }
    return cached;
}
