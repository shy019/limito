import { test, expect } from '@playwright/test';

test.describe('Product Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/catalogo');
  });

  test('should display products in catalog', async ({ page }) => {
    const products = page.locator('[data-testid^="product-"]');
    await expect(products.first()).toBeVisible();
  });

  test('should navigate to product detail', async ({ page }) => {
    const firstProduct = page.locator('.group').first();
    await firstProduct.click();
    await expect(page).toHaveURL(/\/producto\//);
  });

  test('should add product to cart', async ({ page }) => {
    await page.goto('/catalogo');
    await page.locator('.group').first().click();
    
    await page.getByTestId('add-to-cart').click();
    
    const cartIcon = page.locator('header').getByRole('link', { name: /cart/i });
    await expect(cartIcon).toContainText('1');
  });

  test('should select different colors', async ({ page }) => {
    await page.goto('/catalogo');
    await page.locator('.group').first().click();
    
    const colorButtons = page.locator('button[data-testid^="color-"]');
    const count = await colorButtons.count();
    
    if (count > 1) {
      await colorButtons.nth(1).click();
      await expect(colorButtons.nth(1)).toHaveClass(/scale-110/);
    }
  });
});
