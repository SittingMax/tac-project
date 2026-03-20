import { test, expect } from '@playwright/test';

type LongTaskEntry = {
  duration: number;
  name: string;
} & Record<string, unknown>;

const asLongTaskEntry = (entry: unknown): LongTaskEntry | null => {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return null;
  }

  const record = entry as Record<string, unknown>;
  if (typeof record.name !== 'string' || typeof record.duration !== 'number') {
    return null;
  }

  return {
    ...record,
    name: record.name,
    duration: record.duration,
  };
};

test.describe('Legal Pages Performance', () => {
  test('Terms of Service should load and not hang', async ({ page }) => {
    // Monitor for long tasks (tasks > 50ms)
    const longTasks: LongTaskEntry[] = [];
    await page.exposeFunction('reportLongTask', (entry: unknown) => {
      const longTask = asLongTaskEntry(entry);
      if (!longTask) {
        return;
      }

      console.log('Long Task Detected:', longTask.name, longTask.duration, 'ms');
      longTasks.push(longTask);
    });

    await page.addInitScript(() => {
      const reportLongTask = (window as Window & { reportLongTask?: (entry: unknown) => void })
        .reportLongTask;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          reportLongTask?.(entry.toJSON());
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    });

    await page.goto('/terms');

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
    await page.goto('/privacy');
    await expect(page.locator('h1', { hasText: 'Privacy Policy' })).toBeVisible({ timeout: 10000 });
  });
});
