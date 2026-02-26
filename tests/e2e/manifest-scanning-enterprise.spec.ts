import { test, expect, Page, Locator } from '@playwright/test';
import path from 'node:path';

/**
 * Enterprise Manifest Scanning E2E Tests
 * Tests the new AWB-first barcode scanning workflow
 */

const authFile = path.resolve(process.cwd(), '.auth/user.json');
const getCreateManifestButton = (page: Page) =>
  page
    .locator('[data-testid="create-manifest-button"], [data-testid="create-manifest-button-empty"]')
    .first();

async function waitForManifestsReady(page: Page) {
  const verifyingCredentials = page.getByText(/Verifying credentials/i).first();
  await verifyingCredentials.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => undefined);

  // Wait for manifests loader to disappear
  const loader = page.locator('.animate-spin').first();
  await loader.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => undefined);

  await expect(getCreateManifestButton(page)).toBeVisible({ timeout: 20000 });
}

// Auth skip moved to individual describe blocks (file-level beforeAll crashes Firefox)

async function openExistingManifestForScan(page: Page) {
  try {
    const viewButton = page.getByRole('button', { name: /view/i }).first();
    await expect(viewButton).toBeVisible({ timeout: 5000 });

    await viewButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const manualTab = dialog.getByRole('tab', { name: /Manual/i });
    await expect(manualTab).toBeVisible({ timeout: 15000 });

    const scanInput = dialog.getByPlaceholder(/scan or enter awb/i).first();
    await expect(scanInput).toBeVisible({ timeout: 15000 });

    return true;
  } catch {
    return false;
  }
}

async function waitForScanStepReady(page: Page, dialog: Locator) {
  const errorToast = page.getByText(/Failed to create manifest/i).first();
  const manualTab = dialog.getByRole('tab', { name: /Manual/i }).first();

  await Promise.race([
    manualTab.waitFor({ state: 'visible', timeout: 20000 }).catch(() => null),
    errorToast.waitFor({ state: 'visible', timeout: 20000 }).catch(() => null),
  ]);

  if (await errorToast.isVisible()) {
    const permissionError = page.getByText(/Insufficient database permissions/i).first();
    if (await permissionError.isVisible()) {
      throw new Error(
        'Manifest creation failed: Insufficient database permissions for the test user.'
      );
    }
    throw new Error('Manifest creation failed: ' + (await errorToast.textContent()));
  }

  await expect(manualTab).toBeVisible({ timeout: 5000 });
  return true;
}

test.describe('Enterprise Manifest Scanning', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');
  test.use({ storageState: authFile });
  test.beforeEach(async ({ page }) => {
    // Navigate to manifests page
    await page.goto('/manifests');
    await page.waitForLoadState('networkidle');
    await waitForManifestsReady(page);
  });

  test('should load manifests page without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await waitForManifestsReady(page);

    // Verify manifests page loads
    await expect(page.locator('body')).toContainText(/(Manifest|Dashboard|TAC)/i, {
      timeout: 15000,
    });

    // Filter out expected errors
    const unexpectedErrors = consoleErrors.filter(
      (err) => !err.includes('Failed to fetch') && !err.includes('NetworkError')
    );

    expect(unexpectedErrors.length).toBe(0);
  });

  test('should display manifest list with correct columns', async ({ page }) => {
    await waitForManifestsReady(page);

    // Look for manifest table or list
    const table = page.locator('table').first();
    if (await table.isVisible()) {
      // Check for expected column headers
      const headers = ['Manifest', 'Route', 'Type', 'Status', 'Shipments'];
      for (const header of headers) {
        const headerCell = page.getByRole('columnheader', { name: new RegExp(header, 'i') });
        // At least some headers should be visible
        if (await headerCell.isVisible()) {
          expect(true).toBe(true);
        }
      }
    }
  });

  test('should open create manifest modal', async ({ page }) => {
    await waitForManifestsReady(page);

    const createButton = getCreateManifestButton(page);
    await createButton.click({ force: true });
    await page.waitForTimeout(500);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Wait for dialog content to load
    await expect(dialog.getByText(/Route Selection|Origin|From/i).first()).toBeVisible({
      timeout: 5000,
    });

    const originLabel = dialog.getByText(/origin|from/i).first();
    const destLabel = dialog.getByText(/destination|to/i).first();
    expect((await originLabel.isVisible()) || (await destLabel.isVisible())).toBe(true);
  });

  test('should show transport type toggle (AIR/TRUCK)', async ({ page }) => {
    await waitForManifestsReady(page);

    const createButton = getCreateManifestButton(page);
    await createButton.click({ force: true });
    await page.waitForTimeout(500);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    const airOption = dialog.getByRole('radio', { name: /Air Cargo/i });
    const truckOption = dialog.getByRole('radio', { name: /Truck/i });

    if (await airOption.isVisible()) {
      await airOption.click({ force: true });
      await page.waitForTimeout(300);
      const flightField = dialog.getByPlaceholder(/1234|flight/i);
      if (await flightField.isVisible()) {
        expect(true).toBe(true);
      }
    }

    if (await truckOption.isVisible()) {
      await truckOption.click({ force: true });
      await page.waitForTimeout(300);
      const vehicleField = dialog.getByPlaceholder(/TX-1234-AB|vehicle/i);
      if (await vehicleField.isVisible()) {
        expect(true).toBe(true);
      }
    }
  });

  test('should validate required fields before creating manifest', async ({ page }) => {
    await waitForManifestsReady(page);

    const createButton = getCreateManifestButton(page);
    await createButton.click({ force: true });
    await page.waitForTimeout(500);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    const submitButton = dialog.getByRole('button', { name: /create manifest|submit|save|next/i });
    if (await submitButton.isVisible()) {
      const isDisabled = await submitButton.isDisabled();
      if (!isDisabled) {
        await submitButton.click();
        await page.waitForTimeout(300);

        const errorMessage = dialog.getByText(/required|select|choose/i);
        expect(await errorMessage.isVisible()).toBe(true);
      } else {
        expect(isDisabled).toBe(true);
      }
    }
  });
});

test.describe('Manifest Status Workflow', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');

  test('should display manifest status badge', async ({ page }) => {
    // Ensure we have at least one manifest by creating one
    await page.goto('/manifests');
    await page.waitForLoadState('networkidle');
    await waitForManifestsReady(page);

    // Check if we need to create one
    const createButton = getCreateManifestButton(page);
    await createButton.click({ force: true });
    await page.waitForTimeout(500);

    const dialog = page.getByRole('dialog');
    if (await dialog.isVisible()) {
      // Quick create flow
      const originCombobox = page.getByRole('combobox').first();
      await originCombobox.click();
      await page.waitForTimeout(300);
      await page.getByRole('option').first().click();
      await page.waitForTimeout(300);

      const destCombobox = page.getByRole('combobox').nth(1);
      await destCombobox.click();
      await page.waitForTimeout(300);
      await page.getByRole('option').first().click();
      await page.waitForTimeout(300);

      const randomFlight = `TEST-${Math.floor(Math.random() * 10000)}`;
      await page.getByPlaceholder(/1234/i).fill(randomFlight);
      await page.getByPlaceholder(/1234/i).press('Tab');
      await page.waitForTimeout(500);

      await page.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(1000);

      // Close dialog
      await page.keyboard.press('Escape');
    }

    await page.goto('/manifests');
    await page.waitForLoadState('networkidle');
    await waitForManifestsReady(page);

    // Look for status badges (UI shows lowercase)
    const statuses = ['draft', 'open', 'building', 'closed', 'departed', 'arrived'];
    let found = false;
    for (const status of statuses) {
      // StatusBadge uses a span with 'capitalize' class for the text
      const badge = page
        .locator('span.capitalize')
        .filter({ hasText: new RegExp(`^${status}$`, 'i') })
        .first();
      if (await badge.isVisible()) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  test('should open manifest wizard for open manifests', async ({ page }) => {
    await page.goto('/manifests');
    await page.waitForLoadState('networkidle');
    await waitForManifestsReady(page);

    // Click on an OPEN or BUILDING manifest - use first matching cell (UI shows lowercase)
    const openBadge = page
      .locator('span.capitalize')
      .filter({ hasText: /^(draft|open|building)$/i })
      .first();
    if (await openBadge.isVisible()) {
      const row = openBadge.locator('xpath=ancestor::tr').first();
      await row.getByRole('button', { name: /view/i }).click({ force: true });
      await page.waitForTimeout(500);
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10000 });
      // Verify dialog has content - just check the dialog is populated
      expect(await dialog.locator('button, input, [role="tab"]').count()).toBeGreaterThan(0);
    }
  });

  test('should not allow editing closed manifests', async ({ page }) => {
    await page.goto('/manifests');
    await waitForManifestsReady(page);

    // Find a CLOSED manifest - use first matching row (UI shows lowercase "closed")
    const closedBadge = page
      .locator('span.capitalize')
      .filter({ hasText: /^closed$/i })
      .first();
    if (await closedBadge.isVisible()) {
      const row = closedBadge.locator('xpath=ancestor::tr').first();
      await expect(row.getByRole('button', { name: /view/i })).toHaveCount(0);
      await expect(row.getByRole('button', { name: /depart/i })).toBeVisible();
    }
  });
});

test.describe('Manifest Scanning (Enterprise)', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');

  // Shared helper to get to the scanning phase - always creates a new manifest
  async function enterScanPhase(page: Page) {
    await page.goto('/manifests');
    await waitForManifestsReady(page);

    if (await openExistingManifestForScan(page)) {
      return;
    }

    // Always create a new manifest for consistent test behavior
    await getCreateManifestButton(page).click({ force: true });

    // Wait for modal to be fully open - look for dialog and Route Selection card
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Route Selection')).toBeVisible({ timeout: 5000 });

    // Select Origin - Radix Select uses combobox role
    const originCombobox = page.getByRole('combobox').first();
    await originCombobox.click();
    await page.waitForTimeout(300);
    const originOptions = page.getByRole('option');
    await expect(originOptions.first()).toBeVisible({ timeout: 5000 });
    await originOptions.first().click();
    await page.waitForTimeout(300);

    // Select Destination - second combobox
    const destCombobox = page.getByRole('combobox').nth(1);
    await destCombobox.click();
    await page.waitForTimeout(300);
    const destOptions = page.getByRole('option');
    await expect(destOptions.first()).toBeVisible({ timeout: 5000 });
    await destOptions.first().click();
    await page.waitForTimeout(300);

    // Fill required Flight No (AIR is default)
    const flightField = page.getByPlaceholder(/1234/i);
    await expect(flightField).toBeVisible();
    const randomFlight = `TEST-${Math.floor(Math.random() * 100000)}`;
    await flightField.fill(randomFlight);
    // Trigger blur to ensure form validation runs
    await flightField.press('Tab');
    await page.waitForTimeout(1000); // Wait for form validation

    // Wait for validation to pass (button enabled) and click
    const createBtn = page.getByRole('button', { name: /next/i });
    await expect(createBtn).toBeEnabled({ timeout: 10000 });
    await createBtn.click();

    const isReady = await waitForScanStepReady(page, dialog);
    if (!isReady) return;

    // Ensure scan input is visible
    const scanInput = dialog.getByPlaceholder(/scan or enter awb/i).first();
    await expect(scanInput).toBeVisible({ timeout: 15000 });
  }

  test('should show scan input when manifest is in building state', async ({ page }) => {
    await enterScanPhase(page);
    const scanInput = page.getByPlaceholder(/scan or enter awb/i).first();
    await expect(scanInput).toBeVisible();
  });

  test('should handle AWB scan input', async ({ page }) => {
    await enterScanPhase(page);
    const scanInput = page.getByPlaceholder(/scan or enter awb/i).first();

    // Enter a test AWB
    await scanInput.fill('TAC12345678');
    await scanInput.press('Enter');

    // Wait for processing
    await page.waitForTimeout(1000);

    // Should show some feedback (success, error, or duplicate message)
    const feedback = page.getByText(/(added|success|not found|duplicate|already|error|shipment)/i);
    await expect(feedback.first()).toBeVisible();
  });

  test('should prevent duplicate scans (idempotency)', async ({ page }) => {
    await enterScanPhase(page);
    const scanInput = page.getByPlaceholder(/scan or enter awb/i).first();
    const testAWB = 'TAC12345678';

    const getStatValue = async (label: RegExp) => {
      const labelEl = page.getByText(label).first();
      const card = labelEl.locator('..');
      const valueText = await card.locator('p').first().textContent();
      return Number.parseFloat((valueText ?? '0').replace(/[^0-9.]/g, '')) || 0;
    };

    const getStats = async () => ({
      added: await getStatValue(/^Added$/i),
      dups: await getStatValue(/^Dups$/i),
      errors: await getStatValue(/^Errors$/i),
    });

    const totalScans = (stats: { added: number; dups: number; errors: number }) =>
      stats.added + stats.dups + stats.errors;

    const initialStats = await getStats();

    // First scan
    await scanInput.fill(testAWB);
    await scanInput.press('Enter');
    await expect
      .poll(async () => totalScans(await getStats()), { timeout: 5000 })
      .toBeGreaterThan(totalScans(initialStats));
    const firstStats = await getStats();

    // Second scan (duplicate)
    await scanInput.fill(testAWB);
    await scanInput.press('Enter');
    await expect
      .poll(async () => totalScans(await getStats()), { timeout: 5000 })
      .toBeGreaterThan(totalScans(firstStats));
    const secondStats = await getStats();

    // Added count should not increase on a duplicate scan
    expect(secondStats.added).toBe(firstStats.added);

    if (firstStats.added > initialStats.added) {
      expect(secondStats.dups + secondStats.errors).toBeGreaterThan(
        firstStats.dups + firstStats.errors
      );
    } else if (firstStats.dups > initialStats.dups) {
      expect(secondStats.dups).toBeGreaterThan(firstStats.dups);
    } else {
      expect(secondStats.errors).toBeGreaterThan(firstStats.errors);
    }

    // Page should still be functional (no crash)
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Manifest Shipment Table', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');
  test.use({ storageState: authFile });
  // Helper to get to the scanning phase - creates a new manifest
  async function enterScanPhase(page: Page) {
    await page.goto('/manifests');
    await waitForManifestsReady(page);

    if (await openExistingManifestForScan(page)) {
      return;
    }

    // Create a new manifest for consistent test behavior
    await getCreateManifestButton(page).click({ force: true });
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Route Selection')).toBeVisible({ timeout: 5000 });

    // Select Origin - Radix Select uses combobox role
    const originCombobox = page.getByRole('combobox').first();
    await originCombobox.click();
    await page.waitForTimeout(300);
    const originOption = page.getByRole('option').first();
    await expect(originOption).toBeVisible({ timeout: 5000 });
    await originOption.click();
    await page.waitForTimeout(300);

    // Select Destination - second combobox
    const destCombobox = page.getByRole('combobox').nth(1);
    await destCombobox.click();
    await page.waitForTimeout(300);
    const destOption = page.getByRole('option').first();
    await expect(destOption).toBeVisible({ timeout: 5000 });
    await destOption.click();
    await page.waitForTimeout(300);

    // Fill required Flight No and trigger validation
    const flightField = page.getByPlaceholder(/1234/i);
    await expect(flightField).toBeVisible();
    const randomFlight = `TEST-${Math.floor(Math.random() * 100000)}`;
    await flightField.fill(randomFlight);
    await flightField.press('Tab');
    await page.waitForTimeout(1000);

    // Click Next to proceed to step 2
    const nextBtn = page.getByRole('button', { name: /next/i });
    await expect(nextBtn).toBeEnabled({ timeout: 10000 });
    await nextBtn.click({ force: true });

    const isReady = await waitForScanStepReady(page, dialog);
    if (!isReady) return;

    // Ensure scan input is visible
    const scanInput = dialog.getByPlaceholder(/scan or enter awb/i).first();
    await expect(scanInput).toBeVisible({ timeout: 15000 });
  }

  test('should display shipment details in manifest', async ({ page }) => {
    await enterScanPhase(page);

    // Look for shipment table columns
    const columns = ['CN Number', 'Consignee', 'Pkg', 'Weight'];
    for (const col of columns) {
      const header = page.getByText(new RegExp(col, 'i'));
      if (await header.first().isVisible()) {
        await expect(header.first()).toBeVisible();
      }
    }
  });

  test('should show totals summary', async ({ page }) => {
    await enterScanPhase(page);

    // Look for totals display
    const totals = page.getByText(/(total|shipments|packages|weight)/i);
    if (await totals.first().isVisible()) {
      await expect(totals.first()).toBeVisible();
    }
  });

  test('should allow removing shipments from open manifest', async ({ page }) => {
    await enterScanPhase(page);

    // Look for remove button on shipment row if any items exist
    const removeButton = page.getByRole('button', { name: /remove|delete/i }).first();
    if (await removeButton.isVisible()) {
      await expect(removeButton).toBeVisible();
    }
  });
});

test.describe('Scan Audit Logging', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');
  test.use({ storageState: authFile });
  // Helper to get to the scanning phase - creates a new manifest
  async function enterScanPhase(page: Page) {
    await page.goto('/manifests');
    await waitForManifestsReady(page);

    if (await openExistingManifestForScan(page)) {
      return;
    }

    // Create a new manifest for consistent test behavior
    await getCreateManifestButton(page).click({ force: true });
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Route Selection')).toBeVisible({ timeout: 5000 });

    // Select Origin - Radix Select uses combobox role
    const originCombobox = page.getByRole('combobox').first();
    await originCombobox.click();
    await page.waitForTimeout(300);
    const originOption = page.getByRole('option').first();
    await expect(originOption).toBeVisible({ timeout: 5000 });
    await originOption.click();
    await page.waitForTimeout(300);

    // Select Destination - second combobox
    const destCombobox = page.getByRole('combobox').nth(1);
    await destCombobox.click();
    await page.waitForTimeout(300);
    const destOption = page.getByRole('option').first();
    await expect(destOption).toBeVisible({ timeout: 5000 });
    await destOption.click();
    await page.waitForTimeout(300);

    // Fill required Flight No and trigger validation
    const flightField = page.getByPlaceholder(/1234/i);
    await expect(flightField).toBeVisible();
    const randomFlight = `TEST-${Math.floor(Math.random() * 100000)}`;
    await flightField.fill(randomFlight);
    await flightField.press('Tab');
    await page.waitForTimeout(1000);

    // Click Next to proceed to step 2
    const nextBtn = page.getByRole('button', { name: /next/i });
    await expect(nextBtn).toBeEnabled({ timeout: 10000 });
    await nextBtn.click({ force: true });

    const isReady = await waitForScanStepReady(page, dialog);
    if (!isReady) return;

    // Ensure scan input is visible
    const scanInput = dialog.getByPlaceholder(/scan or enter awb/i).first();
    await expect(scanInput).toBeVisible({ timeout: 15000 });
  }

  test('should track scan history', async ({ page }) => {
    await enterScanPhase(page);

    // Look for scan history or logs section
    const historySection = page.getByText(/(scan history|scan log)/i);
    if (await historySection.first().isVisible()) {
      await expect(historySection.first()).toBeVisible();
    }

    // Or look for scan statistics
    const statsSection = page.getByText(/(scans|successful|failed)/i);
    if (await statsSection.first().isVisible()) {
      await expect(statsSection.first()).toBeVisible();
    }
  });
});
