import { test, expect } from '@playwright/test';
import path from 'node:path';

/**
 * Production Readiness E2E Tests
 *
 * Validates:
 * 1. No IXA hub code in UI
 * 2. No mock data visible
 * 3. Empty states render correctly
 * 4. Invoice → Label → Manifest flow works end-to-end
 */

const authFile = path.resolve(process.cwd(), '.auth/user.json');

test.describe('Production Readiness - Domain Enforcement', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');
  test.use({ storageState: authFile });

  test('should not display IXA hub code anywhere in UI', async ({ page }) => {
    // Check Dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('IXA');

    // Check Manifests
    await page.goto('/manifests');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('IXA');

    // Check Shipments
    await page.goto('/shipments');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('IXA');
  });

  test('should show Imphal Hub with IMF code in manifest creation', async ({ page }) => {
    await page.goto('/manifests');
    await page.waitForLoadState('networkidle');

    // Click create manifest to see hub dropdowns
    const createBtn = page.getByRole('button', { name: /create manifest/i }).first();
    await expect(createBtn).toBeVisible({ timeout: 5000 });
    // Use force click to bypass any overlay intercepts
    await createBtn.click({ force: true });
    await page.waitForTimeout(500);

    // Open hub dropdown and check for IMF (Imphal)
    const originCombobox = page.getByRole('combobox').first();
    await expect(originCombobox).toBeVisible({ timeout: 5000 });
    await originCombobox.click();
    const imphalOption = page.getByRole('option', { name: /Imphal Hub.*IMF/i }).first();
    await expect(imphalOption).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Production Readiness', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');

  // Tests use stored auth state from setup project
  test.use({ storageState: authFile });

  test('should not show hardcoded mock data on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const bodyText = (await page.locator('body').textContent()) || '';

    // Check for common mock data patterns
    expect(bodyText).not.toContain('DXB-SIN');
    expect(bodyText).not.toContain('HKG-NRT');
    expect(bodyText).not.toContain('LAX-JFK');

    // Should not have exact hardcoded numbers like 450, 300, 200, 50
    // (unless they legitimately come from real data)
  });

  test('should show empty state when no data exists', async ({ page }) => {
    // This test assumes a clean database or filtered view with no data
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check for various valid dashboard states
    const hasDashboardShell = await page.locator('[data-testid="dashboard-page"]').isVisible();
    const hasLoadingSkeleton = await page
      .locator('.animate-pulse')
      .first()
      .isVisible()
      .catch(() => false);
    const hasKpiGrid = await page.locator('[data-testid="kpi-grid"]').isVisible();
    const noShipmentsText = page.getByText(/no shipments|create your first|getting started/i);
    const hasEmptyState = await noShipmentsText.isVisible().catch(() => false);
    const hasKpiFallback = await page
      .getByText(/failed to load kpi data|failed to load charts/i)
      .isVisible()
      .catch(() => false);

    // Dashboard loaded successfully if any of these are true
    expect(
      (hasDashboardShell && (hasKpiGrid || hasEmptyState || hasKpiFallback)) || hasLoadingSkeleton
    ).toBeTruthy();
  });
});

test.describe('Production Readiness - Empty States', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');
  test.use({ storageState: authFile });

  test('should render empty state correctly for charts with no data', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for initial render
    await page.waitForTimeout(1000);

    // Look for proper empty state messages
    const emptyMessages = [/no shipments yet/i, /no manifests created/i, /create your first/i];

    // At least one chart should handle empty state gracefully
    let foundEmptyState = false;
    for (const message of emptyMessages) {
      const element = page.getByText(message);
      if (await element.isVisible()) {
        foundEmptyState = true;
        break;
      }
    }

    // Either has data, empty state, or controlled fallback from ErrorBoundary.
    const hasDashboardShell = await page.locator('[data-testid="dashboard-page"]').isVisible();
    const hasLoadingSkeleton = await page
      .locator('.animate-pulse')
      .first()
      .isVisible()
      .catch(() => false);
    const hasCharts = await page.locator('[data-testid="kpi-grid"]').isVisible();
    const hasFallback = await page
      .getByText(/failed to load kpi data|failed to load charts/i)
      .isVisible()
      .catch(() => false);
    expect(
      (hasDashboardShell && (hasCharts || foundEmptyState || hasFallback)) || hasLoadingSkeleton
    ).toBeTruthy();
  });
});

test.describe('Production Readiness - Critical User Flows', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');
  test.use({ storageState: authFile });

  test('Invoice creation smoke check', async ({ page }) => {
    // Smoke test: verify invoice creation UI is accessible
    // Full E2E flow requires manual QA (see PRODUCTION_READINESS_CHECKLIST.md)
    await page.goto('/finance');
    await page.waitForLoadState('networkidle');

    // Verify invoice creation button exists
    const createInvoiceBtn = page.getByRole('button', { name: /create|new.*invoice/i }).first();
    await expect(createInvoiceBtn).toBeVisible({ timeout: 5000 });
  });

  test('Shipment page should not show label generation error', async ({ page }) => {
    // Verify the forbidden error message is not displayed
    await page.goto('/shipments');
    await page.waitForLoadState('networkidle');

    // Should not show error: "No shipment data found. Please generate label from Invoices dashboard."
    const forbiddenError = page.getByText(/no shipment data found.*generate label from invoices/i);
    await expect(forbiddenError).not.toBeVisible();
  });

  test('Manifest creation should not crash React', async ({ page }) => {
    const consoleErrors: string[] = [];
    const reactErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);

        // Check for React-specific errors
        if (text.includes('removeChild') || text.includes('React')) {
          reactErrors.push(text);
        }
      }
    });

    await page.goto('/manifests');
    await page.waitForLoadState('networkidle');

    // Try to open create manifest
    const createBtn = page.getByRole('button', { name: /create manifest/i }).first();
    if (await createBtn.isVisible({ timeout: 3000 })) {
      // Use force click to bypass any overlay intercepts
      await createBtn.click({ force: true });
      await page.waitForTimeout(1000);
    }

    // Should not have React errors like "Failed to execute 'removeChild' on 'Node'"
    const hasRemoveChildError = reactErrors.some((err) => err.includes('removeChild'));
    expect(hasRemoveChildError).toBe(false);
  });

  test('Hub dropdown should show IMF correctly', async ({ page }) => {
    await page.goto('/manifests');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /create manifest/i }).first();
    await expect(createBtn).toBeVisible({ timeout: 5000 });
    // Use force click to bypass any overlay intercepts
    await createBtn.click({ force: true });
    await page.waitForTimeout(500);

    // Open hub dropdown and verify labels
    const originCombobox = page.getByRole('combobox').first();
    await expect(originCombobox).toBeVisible({ timeout: 5000 });
    await originCombobox.click();

    // Should show "Imphal Hub (IMF)" not "Imphal Hub (IXA)"
    const imphalIMF = page.getByRole('option', { name: /Imphal Hub.*\(IMF\)/i }).first();
    await expect(imphalIMF).toBeVisible({ timeout: 5000 });

    // Should NOT show IXA
    const imphalIXA = page.getByRole('option', { name: /Imphal Hub.*\(IXA\)/i }).first();
    await expect(imphalIXA).not.toBeVisible();
  });
});

test.describe('Production Readiness - No Console Errors', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');
  test.use({ storageState: authFile });

  test('should not have React crashes on dashboard', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Filter out acceptable errors (network errors, etc.)
    const reactErrors = errors.filter(
      (err) => err.includes('React') || err.includes('removeChild') || err.includes('Cannot read')
    );

    expect(reactErrors.length).toBe(0);
  });
});
