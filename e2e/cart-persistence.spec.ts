import { test, expect } from '@playwright/test';

test.describe('Cart Persistence', () => {
  test('should persist cart across page reloads', async ({ page }) => {
    await page.goto('/catalogo');
    await page.locator('.group').first().click();
    await page.getByTestId('add-to-cart').click();
    
    // Wait for cart to update
    await page.waitForTimeout(500);
    
    // Reload page
    await page.reload();
    
    // Cart should still have items
    const cartBadge = page.locator('header span').filter({ hasText: /\d+/ });
    await expect(cartBadge).toBeVisible();
  });

  test('should persist cart across navigation', async ({ page }) => {
    await page.goto('/catalogo');
    await page.locator('.group').first().click();
    await page.getByTestId('add-to-cart').click();
    
    // Navigate away
    await page.goto('/catalogo');
    
    // Cart should still have items
    const cartBadge = page.locator('header span').filter({ hasText: /\d+/ });
    await expect(cartBadge).toBeVisible();
  });

  test('should clear cart after successful purchase', async ({ page }) => {
    await page.goto('/catalogo');
    await page.locator('.group').first().click();
    await page.getByTestId('add-to-cart').click();
    
    // Simulate successful purchase
    await page.goto('/checkout/success');
    
    // Wait for cart to clear
    await page.waitForTimeout(500);
    
    // Navigate to catalog
    await page.goto('/catalogo');
    
    // Cart should be empty
    const cartBadge = page.locator('header span').filter({ hasText: /\d+/ });
    await expect(cartBadge).not.toBeVisible();
  });

  test('should update cart count when adding multiple items', async ({ page }) => {
    await page.goto('/catalogo');
    await page.locator('.group').first().click();
    
    // Add item twice
    await page.getByTestId('add-to-cart').click();
    await page.waitForTimeout(500);
    await page.getByTestId('add-to-cart').click();
    await page.waitForTimeout(500);
    
    // Cart should show 2
    const cartBadge = page.locator('header span').filter({ hasText: /2/ });
    await expect(cartBadge).toBeVisible();
  });
});
