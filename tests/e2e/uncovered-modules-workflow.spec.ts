import { test, expect } from '@playwright/test';
import path from 'node:path';

const authFile = path.resolve(process.cwd(), '.auth/user.json');

type RouteCheck = {
  name: string;
  path: string;
  heading: RegExp;
};

const ROUTES: RouteCheck[] = [
  { name: 'Analytics', path: '/analytics', heading: /telemetry/i },
  { name: 'Inventory', path: '/inventory', heading: /network inventory/i },
  { name: 'Customers', path: '/customers', heading: /client roster/i },
  { name: 'Management', path: '/management', heading: /staff\s*&\s*hubs/i },
  { name: 'Messages', path: '/admin/messages', heading: /^messages$/i },
  { name: 'Shift Report', path: '/shift-report', heading: /shift handover/i },
  { name: 'Settings', path: '/settings', heading: /system config/i },
];

test.describe('Uncovered Module Workflow Smoke', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');
  test.use({ storageState: authFile });

  // ── Smoke: heading visibility (runs on all browsers) ──
  for (const route of ROUTES) {
    test(`${route.name} should load and be accessible`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });

      await expect(page).not.toHaveURL(/\/login/i);
      await expect(page.locator('body')).not.toContainText(/403 forbidden|insufficient/i);
      await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible();
    });
  }

  // ── Interaction tests (Desktop Chromium only) ──
  // These test interactive elements (dialogs, dropdowns, tabs) that rely on
  // desktop-sized viewports and can be obscured on mobile.

  test('Customers basic workflow: open create dialog and cancel', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Interactive workflow — Chromium only');
    await page.goto('/customers');

    await page.getByTestId('add-customer-button').click({ force: true });
    await expect(page.getByTestId('create-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('create-dialog')).not.toBeVisible();
  });

  test('Management basic workflow: open invite dialog and cancel', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Interactive workflow — Chromium only');
    await page.goto('/management');

    await page.getByRole('button', { name: /invite user/i }).click({ force: true });
    await expect(page.getByTestId('create-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('create-dialog')).not.toBeVisible();
  });

  test('Messages basic workflow: refresh inbox', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Interactive workflow — Chromium only');
    await page.goto('/admin/messages');

    await page.getByRole('button', { name: /refresh/i }).click({ force: true });
    await expect(page.getByRole('heading', { name: /^messages$/i })).toBeVisible();
  });

  test('Shift report basic workflow: change duration filter', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Interactive workflow — Chromium only');
    await page.goto('/shift-report');

    await page.getByRole('combobox').first().click({ force: true });
    await page.getByRole('option', { name: /last 12 hours/i }).click({ force: true });
    await expect(page.getByText(/12 hours/i)).toBeVisible();
  });

  test('Settings basic workflow: switch tabs and search audit logs', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Interactive workflow — Chromium only');
    await page.goto('/settings');

    // Switch to Security & Auth tab
    await page.getByText('SECURITY_AUTH', { exact: true }).click({ force: true });
    await expect(page.getByText(/notifications/i).first()).toBeVisible();

    // Switch to Audit Stream tab
    await page.getByText('AUDIT_STREAM', { exact: true }).click({ force: true });
    await page.getByPlaceholder(/filter audit stream/i).fill('LOGIN');
    await expect(page.getByText(/security audit stream/i).first()).toBeVisible();
  });
});
