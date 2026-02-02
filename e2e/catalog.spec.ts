import { test, expect } from '@playwright/test';

test.describe('Catalog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/catalogo');
  });

  test('should display all available products', async ({ page }) => {
    const products = page.locator('.group');
    const count = await products.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show product details on hover', async ({ page }) => {
    const firstProduct = page.locator('.group').first();
    await firstProduct.hover();
    
    await expect(firstProduct.locator('text=/ver detalles/i')).toBeVisible({ timeout: 2000 });
  });

  test('should display stock warnings for low stock items', async ({ page }) => {
    const stockBadges = page.locator('text=/left|quedan/i');
    const count = await stockBadges.count();
    
    if (count > 0) {
      await expect(stockBadges.first()).toBeVisible();
    }
  });

  test('should show product prices', async ({ page }) => {
    const prices = page.locator('text=/\\$[0-9,]+/');
    const count = await prices.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display color options', async ({ page }) => {
    const colorCircles = page.locator('div[style*="backgroundColor"]').first();
    await expect(colorCircles).toBeVisible();
  });

  test('should have working back to home link', async ({ page }) => {
    await page.locator('a[href="/"]').click();
    await expect(page).toHaveURL('/');
  });

  test('should show total stock in banner', async ({ page }) => {
    const banner = page.locator('text=/solo quedan|unidades/i');
    await expect(banner).toBeVisible();
  });
});
