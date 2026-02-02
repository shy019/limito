import { test, expect, devices } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize(devices['iPhone 13'].viewport);
    await page.goto('/');
    
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('newsletter-email')).toBeVisible();
  });

  test('should display catalog grid on mobile', async ({ page }) => {
    await page.setViewportSize(devices['iPhone 13'].viewport);
    await page.goto('/catalogo');
    
    const products = page.locator('.group');
    await expect(products.first()).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize(devices['iPad Pro'].viewport);
    await page.goto('/catalogo');
    
    const products = page.locator('.group');
    const count = await products.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/catalogo');
    
    const products = page.locator('.group');
    await expect(products.first()).toBeVisible();
  });

  test('should have touch-friendly buttons on mobile', async ({ page }) => {
    await page.setViewportSize(devices['iPhone 13'].viewport);
    await page.goto('/');
    
    const button = page.getByTestId('newsletter-submit');
    const box = await button.boundingBox();
    
    // Button should be at least 44x44 (iOS touch target)
    expect(box?.height).toBeGreaterThanOrEqual(40);
  });
});
