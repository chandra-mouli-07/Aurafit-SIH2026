import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig } from 'eslint/config'

export default defineConfig({
  // ignore common build/output folders (alternatively keep a .eslintignore)
  ignorePatterns: ['dist/', 'build/', 'node_modules/', '.next/', 'out/'],

  // language options applied to all files
  languageOptions: {
    env: { browser: true, node: true, es2024: true },
    globals: globals.browser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
    },
  },

  // help find dead disable comments
  reportUnusedDisableDirectives: true,

  // register plugin objects for flat config
  plugins: {
    react,
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
  },

  // per-file overrides
  overrides: [
    {
      files: ['**/*.{js,jsx}'],
      extends: [
        js.configs.recommended,
        react.configs.recommended, // react plugin recommended rules
        reactHooks.configs.flat.recommended,
        reactRefresh.configs.vite,
      ],
      rules: {
        // turn off rules that are obsolete with the modern React JSX transform
        'react/react-in-jsx-scope': 'off',
        // example: adjust or add project-specific rule tweaks here
      },
      settings: {
        react: { version: 'detect' },
      },
    },

    // tests (Jest) override: enable Jest globals and env
    {
      files: ['**/*.test.{js,jsx}', '**/__tests__/**/*.{js,jsx}'],
      languageOptions: {
        env: { jest: true },
        globals: globals.jest,
      },
    },

    // (optional) add TypeScript override if you use TS:
    // {
    //   files: ['**/*.{ts,tsx}'],
    //   languageOptions: { parser: '@typescript-eslint/parser' },
    //   plugins: { '@typescript-eslint': require('@typescript-eslint/eslint-plugin') },
    //   extends: [
    //     js.configs.recommended,
    //     // add @typescript-eslint flat config here if installed
    //   ],
    //   rules: { /* TS-specific rules */ },
    // },
  ],
})
