import { test, expect, Page } from '@playwright/test';

// Helper: login via password page
async function loginWithCode(page: Page, code = 'LIMITO2026') {
  await page.goto('/password');
  await page.locator('[data-testid="password-input"]').fill(code);
  await page.locator('[data-testid="access-button"]').click();
  await page.waitForURL('/catalog', { timeout: 15000 });
}

test.describe('Password Flow', () => {
  test('shows password gate on home', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/password/);
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="access-button"]')).toBeVisible();
  });

  test('wrong password shows error', async ({ page }) => {
    await page.goto('/password');
    await page.locator('[data-testid="password-input"]').fill('WRONG');
    await page.locator('[data-testid="access-button"]').click();
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 });
  });

  test('correct code redirects to catalog', async ({ page }) => {
    await loginWithCode(page);
    await expect(page).toHaveURL('/catalog');
  });

  test('protected routes redirect without auth', async ({ page }) => {
    await page.goto('/catalog');
    await page.waitForURL(/password/);
  });
});

// Use serial mode to share login state and avoid rate limiting
test.describe.serial('Catalog & Cart', () => {
  let loggedInPage: Page;

  test('login and see products', async ({ page }) => {
    await loginWithCode(page);
    loggedInPage = page;
    const products = page.locator('.product-card');
    await expect(products.first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/\\$[0-9,.]+/').first()).toBeVisible();
  });

  test('open product modal and add to cart', async ({ page }) => {
    await loginWithCode(page);
    await page.locator('.product-card').first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="add-to-cart"]')).toBeVisible({ timeout: 5000 });
    await page.locator('[data-testid="add-to-cart"]').click();
    await page.waitForTimeout(2000);
    const cartBadge = page.locator('header').locator('text=/[1-9]/');
    await expect(cartBadge).toBeVisible({ timeout: 5000 });
  });

  test('cart page shows product', async ({ page }) => {
    await loginWithCode(page);
    // Add product first
    await page.locator('.product-card').first().click();
    await page.waitForTimeout(500);
    await page.locator('[data-testid="add-to-cart"]').click();
    await page.waitForTimeout(2000);
    await page.goto('/cart');
    await expect(page.locator('h1')).toContainText(/carrito|cart/i, { timeout: 5000 });
    await expect(page.locator('h3').first()).toBeVisible();
  });
});
