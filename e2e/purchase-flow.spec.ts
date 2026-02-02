import { test, expect } from '@playwright/test';

test.describe('Complete Purchase Flow', () => {
  test('should complete full purchase journey', async ({ page }) => {
    // 1. Start at home
    await page.goto('/');
    await expect(page.getByTestId('password-input')).toBeVisible();

    // 2. Access with password (if configured)
    // await page.getByTestId('password-input').fill('limito2024');
    // await page.getByTestId('access-button').click();

    // 3. Navigate to catalog
    await page.goto('/catalogo');
    await expect(page.locator('.group').first()).toBeVisible();

    // 4. Click on first product
    await page.locator('.group').first().click();
    await expect(page).toHaveURL(/\/producto\//);

    // 5. Select color if multiple available
    const colorButtons = page.locator('button[data-testid^="color-"]');
    const colorCount = await colorButtons.count();
    if (colorCount > 1) {
      await colorButtons.nth(1).click();
    }

    // 6. Increase quantity
    const plusButton = page.locator('button').filter({ hasText: '+' }).first();
    await plusButton.click();

    // 7. Add to cart
    await page.getByTestId('add-to-cart').click();
    await expect(page.getByText(/agregado/i)).toBeVisible({ timeout: 3000 });

    // 8. Verify cart count
    const cartBadge = page.locator('header span').filter({ hasText: /\d+/ });
    await expect(cartBadge).toBeVisible();

    // 9. Go to checkout
    await page.locator('header a[href="/checkout"]').click();
    await expect(page).toHaveURL(/\/checkout/);
  });

  test('should enforce 5 item limit', async ({ page }) => {
    await page.goto('/catalogo');
    await page.locator('.group').first().click();

    // Try to add 6 items
    const addButton = page.getByTestId('add-to-cart');
    for (let i = 0; i < 6; i++) {
      await addButton.click();
      await page.waitForTimeout(500);
    }

    // Should show error or stop at 5
    const cartCount = await page.locator('header span').filter({ hasText: /\d+/ }).textContent();
    expect(parseInt(cartCount || '0')).toBeLessThanOrEqual(5);
  });
});
