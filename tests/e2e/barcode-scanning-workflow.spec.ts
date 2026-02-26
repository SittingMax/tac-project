/**
 * Comprehensive Barcode Scanning Workflow Tests
 *
 * Tests the enterprise-grade barcode scanning system:
 * - Hardware scanner detection (keyboard wedge simulation)
 * - Scan preview dialog with invoice details
 * - Navigation to finance/invoice page
 * - Error handling for missing invoices
 * - Manifest scanning
 * - Unknown barcode format handling
 * - Context-aware scanning (dashboard vs scanning page)
 */

import { test, expect, Page } from '@playwright/test';
import path from 'node:path';

const authFile = path.resolve(process.cwd(), '.auth/user.json');

/**
 * Simulate hardware barcode scanner (keyboard wedge) by dispatching
 * KeyboardEvents directly in the browser context.
 *
 * Playwright's keyboard.press() has ~50-100ms CDP overhead per call,
 * which exceeds the 150ms scanner detection threshold. By dispatching
 * events inside page.evaluate() we get precise 20ms inter-key timing.
 */
async function simulateScan(page: Page, barcode: string, speed = 20) {
  // Ensure no input is focused so scanner provider captures globally
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });
  await page.waitForTimeout(300);

  await page.evaluate(
    ({ chars, delayMs }) => {
      return new Promise<void>((resolve) => {
        let i = 0;
        function sendNext() {
          if (i < chars.length) {
            const key = chars[i];
            const opts: KeyboardEventInit = {
              key,
              code: `Key${key.toUpperCase()}`,
              bubbles: true,
              cancelable: true,
            };
            // ScanningProvider listens on window (capture phase)
            window.dispatchEvent(new KeyboardEvent('keydown', opts));
            window.dispatchEvent(new KeyboardEvent('keyup', opts));
            i++;
            setTimeout(sendNext, delayMs);
          } else {
            // Send Enter terminator
            const enterOpts: KeyboardEventInit = {
              key: 'Enter',
              code: 'Enter',
              bubbles: true,
              cancelable: true,
            };
            window.dispatchEvent(new KeyboardEvent('keydown', enterOpts));
            window.dispatchEvent(new KeyboardEvent('keyup', enterOpts));
            resolve();
          }
        }
        sendNext();
      });
    },
    { chars: barcode.split(''), delayMs: speed }
  );

  // Give the auto-submit timer time to fire and dialog to render
  await page.waitForTimeout(500);
}

// ─── Dashboard Scanning ──────────────────────────────────────────────────────

test.describe('Barcode Scanning – Dashboard Invoice Preview', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');
  test.use({ storageState: authFile });

  test('scan shipment barcode → invoice preview dialog appears', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await simulateScan(page, 'TAC20260001');

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Title should say "Invoice Preview" (not "Shipment Scanned")
    await expect(dialog.locator('text=Invoice Preview')).toBeVisible();
  });

  test('dialog shows invoice amount, customer, and AWB', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await simulateScan(page, 'TAC20260001');

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Total Amount label should be visible
    await expect(dialog.locator('text=Total Amount')).toBeVisible();

    // AWB should be shown
    await expect(dialog.locator('text=TAC20260001')).toBeVisible();
  });

  test('"View Full Details" navigates to /finance?awb=...', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await simulateScan(page, 'TAC20260001');

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.locator('button:has-text("View Full Details")').click();

    await expect(page).toHaveURL(/\/finance\?awb=TAC20260001/, { timeout: 10000 });
  });

  test('"Dismiss" closes dialog, stays on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await simulateScan(page, 'TAC20260001');

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.locator('button:has-text("Dismiss")').click({ force: true });

    await expect(dialog).not.toBeVisible({ timeout: 3000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('"Copy" button is clickable', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await simulateScan(page, 'TAC20260001');

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const copyBtn = dialog.locator('button:has-text("Copy")');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click(); // Should not throw
  });
});

// ─── Error Handling ──────────────────────────────────────────────────────────

test.describe('Barcode Scanning – Error Handling', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');
  test.use({ storageState: authFile });

  test('non-existent AWB shows error in dialog', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await simulateScan(page, 'TAC00000000');

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Should show an error (either "not found" for shipment or invoice)
    await expect(dialog.locator('text=/not found/i')).toBeVisible({ timeout: 5000 });
  });

  test('unknown barcode format shows scanned value', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await simulateScan(page, 'UNKNOWN12345');

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await expect(dialog.locator('text=Barcode Scanned')).toBeVisible();
    await expect(dialog.locator('text=UNKNOWN12345')).toBeVisible();
  });
});

// ─── Manifest Scanning ───────────────────────────────────────────────────────

test.describe('Barcode Scanning – Manifest Preview', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');
  test.use({ storageState: authFile });

  test('MAN barcode shows manifest preview dialog', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await simulateScan(page, 'MAN20260001');

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await expect(dialog.locator('text=Manifest Scanned')).toBeVisible();
  });
});

// ─── Context-Aware Scanning ──────────────────────────────────────────────────

test.describe('Barcode Scanning – Context Awareness', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');
  test.use({ storageState: authFile });

  test('/scanning page handles scans locally (no invoice preview dialog)', async ({ page }) => {
    await page.goto('/scanning');
    await page.waitForLoadState('networkidle');

    await simulateScan(page, 'TAC20260001');

    // The Invoice Preview dialog should NOT appear here
    const invoiceDialog = page.locator('[role="dialog"]:has-text("Invoice Preview")');
    await expect(invoiceDialog).not.toBeVisible({ timeout: 3000 });
  });
});

// ─── Rapid / Consecutive Scans ───────────────────────────────────────────────

test.describe('Barcode Scanning – Performance', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');
  test.use({ storageState: authFile });

  test('handles 3 consecutive scan-dismiss cycles', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    for (let i = 0; i < 3; i++) {
      await simulateScan(page, 'TAC20260001');

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      await dialog.locator('button:has-text("Dismiss")').click({ force: true });
      await expect(dialog).not.toBeVisible({ timeout: 3000 });

      // Short pause between cycles
      await page.waitForTimeout(500);
    }

    // Dashboard should still be responsive
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
  });

  test('slow manual typing does NOT trigger scanner dialog', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Dispatch keystrokes at 200ms intervals (human speed, above 150ms threshold)
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
    await page.waitForTimeout(300);

    await page.evaluate(
      ({ chars }) => {
        return new Promise<void>((resolve) => {
          let i = 0;
          function sendNext() {
            if (i < chars.length) {
              const key = chars[i];
              window.dispatchEvent(
                new KeyboardEvent('keydown', {
                  key,
                  code: `Key${key.toUpperCase()}`,
                  bubbles: true,
                  cancelable: true,
                })
              );
              i++;
              setTimeout(sendNext, 200); // 200ms = human speed
            } else {
              window.dispatchEvent(
                new KeyboardEvent('keydown', {
                  key: 'Enter',
                  code: 'Enter',
                  bubbles: true,
                  cancelable: true,
                })
              );
              resolve();
            }
          }
          sendNext();
        });
      },
      { chars: 'TAC20260001'.split('') }
    );

    // Wait a moment, dialog should NOT appear
    await page.waitForTimeout(1500);
    const invoiceDialog = page.locator('[role="dialog"]:has-text("Invoice Preview")');
    await expect(invoiceDialog).not.toBeVisible();
  });
});
