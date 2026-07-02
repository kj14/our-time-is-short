import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// @ts-expect-error — Vite handles raw CSS imports; no TS module shim needed.
import './index.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
