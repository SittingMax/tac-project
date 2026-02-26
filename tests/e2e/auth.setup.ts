/**
 * Authentication Setup for E2E Tests
 * Handles login state persistence across tests
 *
 * In CI without staging backend:
 * - E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars configure test credentials
 * - If not set, auth tests are skipped and unauthenticated tests run
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, '../../.auth/user.json');

// Ensure .auth directory exists
try {
  mkdirSync(path.dirname(authFile), { recursive: true });
} catch {
  // Directory may already exist
}

setup('authenticate', async ({ page }) => {
  // Use port 4173 (preview) in CI, port 5173 (dev) locally
  const BASE_URL =
    process.env.BASE_URL || (process.env.CI ? 'http://localhost:4173' : 'http://localhost:5173');

  // Get credentials from environment variables only (no hardcoded fallbacks)
  const testEmail = process.env.E2E_TEST_EMAIL;
  const testPassword = process.env.E2E_TEST_PASSWORD;

  // Without configured credentials, create empty auth state and skip
  if (!testEmail || !testPassword) {
    console.log('⚠️ E2E_TEST_EMAIL or E2E_TEST_PASSWORD not configured');

    if (process.env.CI) {
      console.error('❌ FATAL: CI run detected but no E2E credentials found.');
      console.error('   Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD secrets in GitHub.');
      throw new Error('Missing E2E credentials in CI');
    }

    console.log('   Creating empty auth state for unauthenticated tests (local dev only)...');

    // Create empty auth state so tests can run (unauthenticated)
    writeFileSync(
      authFile,
      JSON.stringify({
        cookies: [],
        origins: [],
      })
    );
    return;
  }

  try {
    // Go to login page
    await page.goto(`${BASE_URL}/login`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.getByTestId('login-email-input');
    const passwordInput = page.getByTestId('login-password-input');
    const submitButton = page.getByTestId('login-submit-button');

    const emailVisible = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (!emailVisible) {
      // If already authenticated, store state and exit early
      if (page.url().includes('/dashboard')) {
        await page.context().storageState({ path: authFile });
        console.log('✅ Authentication already present; stored state.');
        return;
      }

      // Fallback to generic selectors (supports alternate login layout)
      const fallbackEmail = page.locator('input[type="email"]').first();
      const fallbackPassword = page.locator('input[type="password"]').first();
      const fallbackSubmit = page.getByRole('button', {
        name: /sign in|log in|authenticate/i,
      });

      await expect(fallbackEmail).toBeVisible({ timeout: 10000 });
      await fallbackEmail.fill(testEmail);
      await fallbackPassword.fill(testPassword);
      await fallbackSubmit.first().click();
    } else {
      // Fill login form
      await emailInput.fill(testEmail);
      await passwordInput.fill(testPassword);

      // Submit
      await submitButton.click();
    }

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Verify we're logged in
    await expect(page.getByRole('heading', { name: /mission control|dashboard/i })).toBeVisible({
      timeout: 10000,
    });

    // Save authentication state
    await page.context().storageState({ path: authFile });
    console.log('✅ Authentication successful');
  } catch (error) {
    console.error('❌ Authentication failed:', error);

    // In CI, we MUST fail if auth fails. Creating empty auth state causes
    // all authenticated tests to fail with obscure timeouts (redirect to landing page).
    // Better to fail the setup step explicitly.
    if (process.env.CI) {
      console.error('   FATAL: Auth setup failed in CI. Check E2E_TEST_EMAIL/PASSWORD secrets.');
      throw error;
    }
  }
});
