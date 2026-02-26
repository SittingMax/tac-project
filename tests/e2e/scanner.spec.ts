import { test, expect } from '@playwright/test';
import path from 'node:path';

const authFile = path.resolve(process.cwd(), '.auth/user.json');

test.describe('Scanner Workflow', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');
  test.use({ storageState: authFile });

  test('should process manual scan input and render scan log entry', async ({ page }) => {
    await page.goto('/scanning');
    await page.waitForLoadState('networkidle');

    const code = `TAC${Date.now().toString().slice(-8)}`;
    const scanInput = page.getByTestId('scan-input');

    await expect(scanInput).toBeVisible();
    await scanInput.fill(code);
    await page.getByTestId('scan-submit-button').click();

    await expect(page.locator(`text=${code}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('should clear manual scan input after submit', async ({ page }) => {
    await page.goto('/scanning');
    await page.waitForLoadState('networkidle');

    const scanInput = page.getByTestId('scan-input');
    await expect(scanInput).toBeVisible();

    await scanInput.fill('TAC12345678');
    await page.getByTestId('scan-submit-button').click();
    await expect(scanInput).toHaveValue('');
  });

  test('should support Enter key submission from scan input', async ({ page }) => {
    await page.goto('/scanning');
    await page.waitForLoadState('networkidle');

    const code = `TAC${(Date.now() + 1).toString().slice(-8)}`;
    const scanInput = page.getByTestId('scan-input');

    await expect(scanInput).toBeVisible();
    await scanInput.fill(code);
    await scanInput.press('Enter');

    await expect(page.locator(`text=${code}`).first()).toBeVisible({ timeout: 10000 });
  });
});
