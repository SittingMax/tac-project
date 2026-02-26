import { test, expect } from '@playwright/test';
import path from 'node:path';

const authFile = path.resolve(process.cwd(), '.auth/user.json');

test.describe('Dashboard Auth Redirect Guard', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'Requires auth credentials');
  test.use({ storageState: authFile });

  test('should navigate via quick action without redirecting to login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const scanPackageButton = page.getByTestId('quick-action-scan-package');
    await expect(scanPackageButton).toBeVisible();

    await scanPackageButton.click();
    await page.waitForURL('**/scanning', { timeout: 15000 });

    await expect(page).toHaveURL(/\/scanning/);
    expect(page.url()).not.toContain('/login');
    await expect(page.getByTestId('scan-input')).toBeVisible();
  });
});
