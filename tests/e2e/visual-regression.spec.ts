/**
 * Visual Regression Tests
 *
 * Uses Playwright screenshot comparison to detect unintended visual changes.
 * Snapshots are stored in tests/e2e/__snapshots__ directory.
 *
 * NOTE: Snapshots are OS-specific (win32/linux). These tests should only
 * run locally where baselines were generated, not in CI.
 */

import { test, expect } from '@playwright/test';
import path from 'node:path';

const authFile = path.resolve(process.cwd(), '.auth/user.json');
const screenshotOptions = {
  animations: 'disabled' as const,
  maxDiffPixelRatio: 0.07,
  timeout: 20000,
};

// Skip all visual regression in CI — snapshots are OS-specific (win32 baselines vs linux CI)
test.skip(!!process.env.CI, 'Visual regression skipped in CI: snapshots are OS-specific');

test.describe('Visual Regression Tests', () => {
  test.describe('Login Page', () => {
    // Always use logged-out state for login visuals to avoid auth redirect races.
    test.use({ storageState: { cookies: [], origins: [] } });

    test('login page matches snapshot', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Wait for animations to complete
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('login-page.png', {
        fullPage: true,
        ...screenshotOptions,
        mask: [
          // Mask dynamic content that may change
          page.locator('[data-testid="login-email-input"]'),
          page.locator('[data-testid="login-password-input"]'),
        ],
      });
    });

    test('login error state matches snapshot', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Use generic selectors that work with current login form
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitBtn = page.getByRole('button', { name: /sign in|log in/i }).first();

      if (await emailInput.isVisible({ timeout: 3000 })) {
        await emailInput.fill('invalid@test.com');
        await passwordInput.fill('wrongpassword');
        await submitBtn.click();

        // Wait for error message to appear
        await page.waitForTimeout(2000);

        await expect(page).toHaveScreenshot('login-error-state.png', {
          fullPage: true,
          ...screenshotOptions,
        });
      }
    });
  });

  test.describe('Dashboard', () => {
    test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');
    test.use({ storageState: authFile });

    test('dashboard page matches snapshot', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Wait for KPI data to load
      await page.waitForSelector('[data-testid="kpi-grid"]', { timeout: 15000 });
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('dashboard-page.png', {
        fullPage: true,
        ...screenshotOptions,
        mask: [
          // Mask dynamic KPI values
          page.locator('[data-testid="kpi-grid"]'),
        ],
      });
    });

    test('dashboard header matches snapshot', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const header = page.locator('[data-testid="dashboard-page"] h1').first();
      await expect(header).toBeVisible();

      await expect(header).toHaveScreenshot('dashboard-header.png', {
        ...screenshotOptions,
      });
    });

    test('quick actions matches snapshot', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const quickActions = page.locator('[data-testid="quick-actions"]');
      await expect(quickActions).toBeVisible();

      await expect(quickActions).toHaveScreenshot('quick-actions.png', {
        ...screenshotOptions,
      });
    });
  });

  test.describe('Manifests Page', () => {
    test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');
    test.use({ storageState: authFile });

    test('manifests page matches snapshot', async ({ page }) => {
      await page.goto('/manifests');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await expect(
        page
          .locator(
            '[data-testid="create-manifest-button"], [data-testid="create-manifest-button-empty"]'
          )
          .first()
      ).toBeVisible();

      await expect(page).toHaveScreenshot('manifests-page.png', {
        ...screenshotOptions,
        mask: [
          // Mask table data that changes
          page.locator('table'),
        ],
      });
    });
  });

  test.describe('Shipments Page', () => {
    test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');
    test.use({ storageState: authFile });

    test('shipments page matches snapshot', async ({ page }) => {
      await page.goto('/shipments');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('shipments-page.png', {
        fullPage: true,
        ...screenshotOptions,
        mask: [
          // Mask table data that changes
          page.locator('table'),
        ],
      });
    });
  });

  test.describe('Responsive Design', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('login page mobile view', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('login-mobile.png', {
        fullPage: true,
        ...screenshotOptions,
      });
    });

    test('login page tablet view', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('login-tablet.png', {
        fullPage: true,
        ...screenshotOptions,
      });
    });
  });

  test.describe('Dark Mode', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('login page dark mode', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('login-dark-mode.png', {
        fullPage: true,
        ...screenshotOptions,
      });
    });
  });
});
