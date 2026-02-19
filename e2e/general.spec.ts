import { test, expect, devices } from '@playwright/test';

test.describe('Accessibility', () => {
  test('password page has visible logo', async ({ page }) => {
    await page.goto('/password');
    await expect(page.locator('img[alt="Logo"]')).toBeVisible();
  });
});

test.describe('Responsive', () => {
  test('works on mobile viewport', async ({ page }) => {
    await page.setViewportSize(devices['iPhone 13'].viewport);
    await page.goto('/password');
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
  });

  test('works on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/password');
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('loads password page quickly', async ({ page }) => {
    const start = Date.now();
    await page.goto('/password');
    await page.waitForLoadState('domcontentloaded');
    expect(Date.now() - start).toBeLessThan(5000);
  });

  test('API responds quickly', async ({ request }) => {
    const start = Date.now();
    await request.get('/api/products');
    expect(Date.now() - start).toBeLessThan(3000);
  });
});

test.describe('Navigation', () => {
  test('unknown routes redirect to password', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz');
    await page.waitForTimeout(1000);
    expect(page.url()).toMatch(/password/);
  });
});
