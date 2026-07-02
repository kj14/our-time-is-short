import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// We enable the two classic hook rules explicitly rather than the plugin's
// full recommended set: react-hooks v7's recommended adds React-Compiler-style
// rules (set-state-in-effect, immutability, …) that flag many pre-existing,
// working patterns. Those are worth a future cleanup pass, but shouldn't block
// the beta lint gate. tsc (strict) remains the real type gate.
const hookRules = {
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',
}

export default defineConfig([
  globalIgnores(['dist', 'dev-dist']),
  // JavaScript (config, tests)
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended, reactRefresh.configs.vite],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      ...hookRules,
      'react-refresh/only-export-components': 'warn',
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  // TypeScript / TSX (the app source)
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, reactRefresh.configs.vite],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      ...hookRules,
      'react-refresh/only-export-components': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
