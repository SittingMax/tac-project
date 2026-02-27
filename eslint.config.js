/**
 * ESLint 9.x Flat Config for TAC Portal
 * Migrated from legacy .eslintrc.json
 */

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
    // Base JavaScript recommended config
    eslint.configs.recommended,

    // TypeScript recommended configs
    ...tseslint.configs.recommended,

    // Global ignores
    {
        ignores: [
            'dist/**',
            'coverage/**',
            'node_modules/**',
            '*.config.js',
            '*.config.ts',
            '*.cjs',
            '.eslintrc.*.cjs',
            'vite.config.ts',
            'playwright.config.ts',
            'supabase/functions/**', // Edge functions use Deno runtime
            'scripts/**/*.mjs', // Node.js scripts
            '**/_backup/**', // Backup files
        ],
    },

    // TypeScript and JavaScript files
    {
        files: ['**/*.{ts,tsx,js,jsx}'],
        plugins: {
            'react-hooks': reactHooks,
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2022,
            },
        },
        rules: {
            // React rules (no plugin needed for basic rules)
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',

            // React Hooks rules
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',

            // TypeScript rules 
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/ban-ts-comment': ['warn', { 'ts-ignore': 'allow-with-description' }],
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-require-imports': 'off',

            // Console rules
            'no-console': ['warn', { allow: ['warn', 'error'] }],

            // Disable base rules that TypeScript handles
            'no-unused-vars': 'off',
            'no-undef': 'off',
        },
    },

    // Allow console.log in dev-only scripts and Playwright setup
    {
        files: ['scripts/**/*.{js,jsx,ts,tsx}', 'tests/e2e/**/*.ts'],
        rules: {
            'no-console': ['warn', { allow: ['log', 'warn', 'error'] }],
        },
    },

    // Strict rules for critical domain code (lib/ and store/)
    // These directories contain business logic, Supabase queries, and state management
    // that must meet higher type safety standards than UI components.
    {
        files: ['lib/**/*.{ts,tsx}', 'store/**/*.{ts,tsx}'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'error',
            'no-restricted-syntax': [
                'warn',
                {
                    selector: 'TSAsExpression > TSUnknownKeyword',
                    message:
                        'Avoid `as unknown as` casts in domain code. Use proper type narrowing or generics instead.',
                },
            ],
        },
    },
);
