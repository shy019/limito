import { test, expect } from '@playwright/test';

test.describe('Shipping Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="password"]', 'Lmt#2024$9Xp');
    await page.click('button[type="submit"]');
    await page.waitForURL('/catalogo');
  });

  test('should calculate shipping for Bogotá', async ({ page }) => {
    const productCard = page.locator('.product-card').first();
    await productCard.click();
    
    await page.click('button:has-text("AGREGAR AL CARRITO")');
    await page.click('a[href="/carrito"]');
    
    await page.selectOption('select', 'Bogotá');
    await expect(page.locator('text=$8,000')).toBeVisible();
  });

  test('should show free shipping for orders over 100K', async ({ page }) => {
    // Add multiple items to reach threshold
    for (let i = 0; i < 2; i++) {
      const productCard = page.locator('.product-card').nth(i);
      await productCard.click();
      await page.click('button:has-text("AGREGAR AL CARRITO")');
      await page.click('button:has-text("×")');
    }
    
    await page.click('a[href="/carrito"]');
    await expect(page.locator('text=GRATIS')).toBeVisible();
  });

  test('should calculate shipping for Cundinamarca', async ({ page }) => {
    const productCard = page.locator('.product-card').first();
    await productCard.click();
    
    await page.click('button:has-text("AGREGAR AL CARRITO")');
    await page.click('a[href="/carrito"]');
    
    await page.selectOption('select', 'Chía');
    await expect(page.locator('text=$8,000')).toBeVisible();
    
    await page.selectOption('select', 'Zipaquirá');
    await expect(page.locator('text=$12,000')).toBeVisible();
  });

  test('should show delivery time estimate', async ({ page }) => {
    const productCard = page.locator('.product-card').first();
    await productCard.click();
    
    await page.click('button:has-text("AGREGAR AL CARRITO")');
    await page.click('a[href="/carrito"]');
    
    await page.selectOption('select', 'Bogotá');
    await expect(page.locator('text=1-2 días hábiles')).toBeVisible();
  });
});
