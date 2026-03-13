import { test, expect } from '@playwright/test';

test.describe('Legal Pages Performance', () => {
  test('Terms of Service should load and not hang', async ({ page }) => {
    // Monitor for long tasks (tasks > 50ms)
    const longTasks: any[] = [];
    await page.exposeFunction('reportLongTask', (entry: any) => {
      console.log('Long Task Detected:', entry.name, entry.duration, 'ms');
      longTasks.push(entry);
    });

    await page.addInitScript(() => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          (window as any).reportLongTask(entry.toJSON());
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    });

    await page.goto('http://localhost:5173/terms');

    // Wait for the main heading
    await expect(page.locator('h1', { hasText: 'Terms and Conditions' })).toBeVisible({
      timeout: 10000,
    });

    // Simulate aggressive scrolling
    console.log('Starting aggressive scroll simulation...');
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 1000);
      await page.waitForTimeout(100);
    }

    // Check if the page is still responsive
    const title = await page.title();
    console.log('Page title after scroll:', title);

    // Wait a brief moment to see if it freezes
    await page.waitForTimeout(2000);

    expect(longTasks.length).toBeLessThan(10); // Arbitrary limit for "normal" usage
  });

  test('Privacy Policy should load and not hang', async ({ page }) => {
    await page.goto('http://localhost:5173/privacy');
    await expect(page.locator('h1', { hasText: 'Privacy Policy' })).toBeVisible({ timeout: 10000 });
  });
});
