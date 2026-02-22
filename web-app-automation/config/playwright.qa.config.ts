import { defineConfig } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

// Load ROOT .env
dotenv.config({
  path: path.resolve(__dirname, '../../.env')
});

export default defineConfig({
  testDir: '../tests',   // ✅ CORRECT PATH

  timeout: 60000,
   workers: 1,           // 🔥 ADD THIS
  fullyParallel: false, // 🔥 ADD THIS

  reporter: [
    ['list'],
    ['html', {
      outputFolder: '../../reports/web/html-report',
      open: 'never'
    }]
  ],

  use: {
    baseURL: process.env.PLANNER_URL,
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  }
});
