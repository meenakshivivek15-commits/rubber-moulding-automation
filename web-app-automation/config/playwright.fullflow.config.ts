import baseConfig from './playwright.qa.config';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  ...baseConfig,
  testMatch: ['**/e2e/fullBusinessFlow.spec.ts'],
});
