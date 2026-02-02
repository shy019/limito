import { test, expect } from '@playwright/test';

test.describe('Password Flow', () => {
  test('should show password gate on home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('access-button')).toBeVisible();
  });

  test('should show error for incorrect password', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('password-input').fill('wrongpassword');
    await page.getByTestId('access-button').click();
    await expect(page.getByTestId('error-message')).toBeVisible();
  });

  test('should redirect to catalog with public password', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('password-input').fill('Lmt#2024$9Xp');
    await page.getByTestId('access-button').click();
    await page.waitForURL('/catalogo');
    await expect(page).toHaveURL('/catalogo');
  });

  test('should redirect to admin panel with admin password', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('password-input').fill('Adm!Lmt@7K9z');
    await page.getByTestId('access-button').click();
    await page.waitForURL('/admin');
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('h1')).toContainText('LIMITØ ADMIN');
  });

  test('should allow newsletter signup', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('newsletter-email').fill('test@example.com');
    await page.getByTestId('newsletter-submit').click();
    await expect(page.getByText(/gracias/i)).toBeVisible({ timeout: 5000 });
  });
});
