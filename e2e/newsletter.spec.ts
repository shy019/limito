import { test, expect } from '@playwright/test';

test.describe('Newsletter Subscription', () => {
  test('should subscribe to newsletter successfully', async ({ page }) => {
    await page.route('/api/newsletter', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto('/');
    
    // Assuming newsletter component is on homepage or catalog
    const emailInput = page.locator('input[type="email"][placeholder*="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await page.locator('button:has(svg)').first().click();
      
      await expect(page.locator('text=¡Suscrito!')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/');
    
    const emailInput = page.locator('input[type="email"][placeholder*="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid-email');
      await page.locator('button[type="submit"]').first().click();
      
      // HTML5 validation should prevent submission
      const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
      expect(validationMessage).toBeTruthy();
    }
  });

  test('should handle API errors', async ({ page }) => {
    await page.route('/api/newsletter', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    await page.goto('/');
    
    const emailInput = page.locator('input[type="email"][placeholder*="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await page.locator('button:has(svg)').first().click();
      
      await expect(page.locator('text=Error al suscribirse')).toBeVisible({ timeout: 5000 });
    }
  });
});
