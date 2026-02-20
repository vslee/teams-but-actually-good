import { defineConfig } from 'eslint/config';

export default defineConfig({
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    // You can add your custom linting rules here later
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn'
  }
});