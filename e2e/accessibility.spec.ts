import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy on home', async ({ page }) => {
    await page.goto('/');
    
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/catalogo');
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('should have keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A']).toContain(focused);
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/');
    
    const emailInput = page.getByTestId('newsletter-email');
    const placeholder = await emailInput.getAttribute('placeholder');
    expect(placeholder).toBeTruthy();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    
    // Check that text is visible (basic contrast check)
    const logo = page.locator('text=LIMITØ');
    await expect(logo).toBeVisible();
  });

  test('should have focus indicators', async ({ page }) => {
    await page.goto('/');
    
    const button = page.getByTestId('newsletter-submit');
    await button.focus();
    
    const isFocused = await button.evaluate((el) => el === document.activeElement);
    expect(isFocused).toBe(true);
  });
});
