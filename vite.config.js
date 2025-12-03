import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoName = 'our-life-is-short'
const isProduction = process.env.NODE_ENV === 'production'

// https://vite.dev/config/
export default defineConfig({
  base: isProduction ? `/${repoName}/` : '/',
  plugins: [react()],
})
