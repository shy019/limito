import { test, expect } from '@playwright/test';

test.describe('Contact Page', () => {
  test('should display contact form', async ({ page }) => {
    await page.goto('/contacto');
    
    await expect(page.locator('h1:has-text("CONTACTO")')).toBeVisible();
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/contacto');
    
    await page.click('button[type="submit"]');
    
    const nameInput = page.locator('input[type="text"]').first();
    await expect(nameInput).toHaveAttribute('required', '');
  });

  test('should submit contact form successfully', async ({ page }) => {
    await page.route('/api/contact', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto('/contacto');
    
    await page.fill('input[type="text"]', 'Juan Pérez');
    await page.fill('input[type="email"]', 'juan@example.com');
    await page.fill('input[type="text"]', 'Consulta sobre producto', { force: true });
    await page.fill('textarea', 'Hola, quisiera saber más sobre los productos');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=¡Mensaje enviado!')).toBeVisible({ timeout: 5000 });
  });

  test('should show error on API failure', async ({ page }) => {
    await page.route('/api/contact', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    await page.goto('/contacto');
    
    await page.fill('input[type="text"]', 'Juan Pérez');
    await page.fill('input[type="email"]', 'juan@example.com');
    await page.fill('textarea', 'Test message');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Error al enviar mensaje')).toBeVisible({ timeout: 5000 });
  });

  test('should have back button to home', async ({ page }) => {
    await page.goto('/contacto');
    
    const backButton = page.locator('a:has-text("Volver")');
    await expect(backButton).toBeVisible();
    await expect(backButton).toHaveAttribute('href', '/');
  });
});
