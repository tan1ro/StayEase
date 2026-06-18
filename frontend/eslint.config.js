import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        global: 'readonly',
        Image: 'readonly',
        createImageBitmap: 'readonly',
      },
    },
  },
  {
    files: ['src/tests/**/*.{js,jsx}'],
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
    },
  },
];
