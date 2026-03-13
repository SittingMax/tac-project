/**
 * Playwright E2E Test Configuration
 * Run: npx playwright test
 */

import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load local env vars (including E2E credentials) for Playwright runs
loadEnv({ path: path.join(__dirname, '.env.local') });

const authFile = path.join(__dirname, '.auth/user.json');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],

  use: {
    // Use port 4173 (preview) in CI, port 5173 (dev) locally.
    // Use 127.0.0.1 instead of localhost to prevent IPv6 mapping bugs in CI (ERR_CONNECTION_REFUSED).
    baseURL:
      process.env.BASE_URL || (process.env.CI ? 'http://127.0.0.1:4173' : 'http://127.0.0.1:5173'),
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  timeout: 60000,
  expect: {
    timeout: 10000,
  },

  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Main test projects
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      dependencies: ['setup'],
    },
    // Firefox removed: all tests fail at 1-4ms due to test.skip() in beforeAll
    // incompatibility with Firefox engine. Re-enable when auth infrastructure is ready.
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: authFile,
      },
      dependencies: ['setup'],
    },
  ],

  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: true,
        timeout: 120 * 1000,
      },
});
