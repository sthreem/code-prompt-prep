import eslint from '@eslint/js';
import prettier from 'eslint-plugin-prettier/recommended';

export default [
  eslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'writable',
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off', // Allow console usage since this is a CLI tool
      'prettier/prettier': 'error',
    },
    ignores: ['node_modules/**'],
  },
];
