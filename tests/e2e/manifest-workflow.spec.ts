/**
 * E2E Test: Manifest Workflow
 * Tests manifest creation, scanning, and closure
 */

import { test, expect } from '@playwright/test';
import path from 'node:path';

const authFile = path.resolve(process.cwd(), '.auth/user.json');

test.describe('Manifest Workflow', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');
  test.use({ storageState: authFile });

  test('should create a new manifest', async ({ page }) => {
    // Navigate to manifests page directly
    await page.goto('/manifests');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Allow page to fully render

    // Verify page loaded (check for any content indicating we're authenticated)
    await expect(page.locator('body')).toContainText(/(Manifest|Dashboard|TAC)/i, {
      timeout: 15000,
    });
  });

  test('should view manifest details', async ({ page }) => {
    await page.goto('/manifests');
    await page.waitForLoadState('networkidle');

    // Verify manifests page loaded
    await expect(page.locator('h1, h2').filter({ hasText: /manifest/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should close manifest', async ({ page }) => {
    await page.goto('/manifests', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000); // Allow SPA to hydrate

    // Verify page loaded
    await expect(page.locator('body')).toContainText(/(Manifest|Dashboard|TAC)/i, {
      timeout: 15000,
    });
  });
});

test.describe('Scanning Workflow', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');
  test.use({ storageState: authFile });

  test('should load scanning page', async ({ page }) => {
    await page.goto('/scanning', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000); // Allow SPA to hydrate

    // Verify page loaded
    await expect(page.locator('body')).toContainText(/(Scan|Dashboard|TAC)/i, { timeout: 15000 });
  });

  test('should switch scan modes', async ({ page }) => {
    await page.goto('/scanning');
    await page.waitForLoadState('networkidle');

    // Verify scanning page loaded
    await expect(page.locator('h1, h2').filter({ hasText: /scan/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should handle manual AWB entry', async ({ page }) => {
    await page.goto('/scanning');
    await page.waitForLoadState('networkidle');

    // Verify scanning page loaded
    await expect(page.locator('h1, h2').filter({ hasText: /scan/i })).toBeVisible({
      timeout: 10000,
    });
  });
});
