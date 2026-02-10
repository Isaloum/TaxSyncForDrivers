// Flat config for ESLint v10+
import globals from 'globals';

export default [
  {
    ignores: [
      'index.html',
      '*.html',
      'dist/',
      'build/',
      'node_modules/',
      'coverage/',
      'coverage/**',
      'coverage/lcov-report/**',
      '.nyc_output/',
      'TaxSyncQC/',
    ],
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        _: 'readonly',
        getFormData: 'readonly',
        TaxCalculator: 'readonly',
        lastCalculationData: 'writable',
        test: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': 'off',
    },
  },
];
