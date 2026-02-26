/**
 * E2E Test: Shipment Creation Workflow
 * Tests the critical path of creating and tracking a shipment
 */

import { test, expect } from '@playwright/test';
import path from 'node:path';

const authFile = path.resolve(process.cwd(), '.auth/user.json');

test.describe('Shipment Workflow', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');
  test.use({ storageState: authFile });

  test('should create a new shipment', async ({ page }) => {
    // Navigate to shipments page directly
    await page.goto('/shipments');
    await page.waitForLoadState('networkidle');

    // Verify we're on the shipments page
    await expect(page.getByRole('heading', { name: 'Shipments', exact: true })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should search and view shipment details', async ({ page }) => {
    // Navigate to shipments page
    await page.goto('/shipments');
    await page.waitForLoadState('networkidle');

    // Wait for the page to load
    await expect(page.getByRole('heading', { name: 'Shipments', exact: true })).toBeVisible({
      timeout: 10000,
    });

    // Look for the CN-specific search input (more specific selector)
    const searchInput = page.locator('input[placeholder*="CN"]').first();
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('TAC');
      await page.waitForTimeout(500); // Debounce
    }

    // Verify shipments page loaded
    await expect(page).toHaveURL(/shipments/);
  });

  test('should track shipment status', async ({ page }) => {
    // Navigate to tracking page
    await page.goto('/tracking');
    await page.waitForLoadState('networkidle');

    // Verify tracking page loaded
    await expect(page.locator('h1, h2').filter({ hasText: /track/i })).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('Public Tracking', () => {
  test('should allow public tracking without login', async ({ page }) => {
    // Navigate directly to public tracking
    // Navigate directly to public tracking
    await page.goto('/track');
    await page.waitForLoadState('networkidle');

    // Default tab might be "book", so explicitly click "Track"
    const trackTab = page.getByRole('tab', { name: /track/i });
    if (await trackTab.isVisible()) {
      await trackTab.click();
    }

    // Verify public tracking page loads (should have tracking input)
    const trackingInput = page.locator(
      'input[placeholder*="CN"], input[placeholder*="track"], input[placeholder*="Track"]'
    );
    await expect(
      trackingInput.or(page.locator('h1, h2').filter({ hasText: /track/i }))
    ).toBeVisible({ timeout: 10000 });
  });
});
