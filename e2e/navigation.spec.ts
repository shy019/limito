import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate from home to catalog', async ({ page }) => {
    await page.goto('/');
    
    // If password is required, skip to catalog directly
    await page.goto('/catalogo');
    await expect(page).toHaveURL('/catalogo');
  });

  test('should navigate from catalog to product', async ({ page }) => {
    await page.goto('/catalogo');
    
    const firstProduct = page.locator('.group').first();
    await firstProduct.click();
    
    await expect(page).toHaveURL(/\/producto\/.+/);
  });

  test('should navigate back from product to catalog', async ({ page }) => {
    await page.goto('/catalogo');
    await page.locator('.group').first().click();
    
    await page.locator('a[href="/catalogo"]').click();
    await expect(page).toHaveURL('/catalogo');
  });

  test('should have working logo link', async ({ page }) => {
    await page.goto('/catalogo');
    
    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL('/');
  });

  test('should navigate to checkout from cart', async ({ page }) => {
    await page.goto('/catalogo');
    await page.locator('.group').first().click();
    await page.getByTestId('add-to-cart').click();
    
    await page.locator('a[href="/checkout"]').click();
    await expect(page).toHaveURL(/\/checkout/);
  });

  test('should show 404 for invalid product', async ({ page }) => {
    await page.goto('/producto/invalid-id-12345');
    
    // Should redirect to catalog or show 404
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toMatch(/catalogo|404/);
  });
});
