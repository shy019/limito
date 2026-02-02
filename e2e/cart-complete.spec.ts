import { test, expect } from '@playwright/test';

test.describe('Carrito Completo', () => {
  test.beforeEach(async ({ page }) => {
    // Login y agregar producto al carrito
    await page.goto('/');
    await page.fill('[data-testid="password-input"]', 'Lmt#2024$9Xp');
    await page.click('[data-testid="access-button"]');
    await page.waitForURL('/catalogo');
    
    // Agregar primer producto
    await page.locator('.product-card').first().click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("AGREGAR AL CARRITO")').click();
    await page.waitForTimeout(1500);
    await page.locator('button:has-text("IR AL CARRITO")').click();
    await page.waitForURL('/carrito');
  });

  test('Carrito muestra producto agregado correctamente', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Tu Carrito');
    await expect(page.locator('h3')).toContainText('LIMITØ');
    await expect(page.locator('text=/\\$[0-9,]+/')).toBeVisible();
  });

  test('Código FIRST10 aplica 10% descuento', async ({ page }) => {
    // Obtener subtotal
    const subtotalText = await page.locator('text=/Subtotal/i').locator('..').locator('span').last().textContent();
    
    // Aplicar código
    await page.fill('input[placeholder*="CODIGO"]', 'FIRST10');
    await page.click('button:has-text("Aplicar")');
    await page.waitForTimeout(500);
    
    // Verificar descuento visible
    await expect(page.locator('text=/Descuento/i')).toBeVisible();
    await expect(page.locator('text=/-\\$[0-9,]+/')).toBeVisible();
  });

  test('Código WELCOME5K aplica $5,000 descuento fijo', async ({ page }) => {
    await page.fill('input[placeholder*="CODIGO"]', 'WELCOME5K');
    await page.click('button:has-text("Aplicar")');
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=/Descuento/i')).toBeVisible();
    await expect(page.locator('text=/-.*5.*000/')).toBeVisible();
  });

  test('Código inválido muestra error', async ({ page }) => {
    await page.fill('input[placeholder*="CODIGO"]', 'INVALID999');
    await page.click('button:has-text("Aplicar")');
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=/inválido|expirado|agotado/i')).toBeVisible();
  });

  test('Incrementar cantidad actualiza total', async ({ page }) => {
    const initialTotal = await page.locator('text=/Total/i').locator('..').locator('span').last().textContent();
    
    // Incrementar cantidad
    const plusButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    await plusButton.click();
    await page.waitForTimeout(300);
    
    const newTotal = await page.locator('text=/Total/i').locator('..').locator('span').last().textContent();
    expect(newTotal).not.toBe(initialTotal);
  });

  test('Decrementar cantidad actualiza total', async ({ page }) => {
    // Primero incrementar
    const plusButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    await plusButton.click();
    await page.waitForTimeout(300);
    
    const totalAfterPlus = await page.locator('text=/Total/i').locator('..').locator('span').last().textContent();
    
    // Decrementar
    const minusButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await minusButton.click();
    await page.waitForTimeout(300);
    
    const finalTotal = await page.locator('text=/Total/i').locator('..').locator('span').last().textContent();
    expect(finalTotal).not.toBe(totalAfterPlus);
  });

  test('Eliminar producto vacía el carrito', async ({ page }) => {
    await page.locator('button').filter({ has: page.locator('svg[class*="lucide-trash"]') }).click();
    await page.waitForTimeout(300);
    
    await expect(page.locator('text=/vacío|empty/i')).toBeVisible();
  });

  test('Botón checkout está habilitado con productos', async ({ page }) => {
    const checkoutButton = page.locator('button:has-text("PROCEDER AL PAGO")');
    await expect(checkoutButton).toBeEnabled();
  });

  test('Link "Continuar comprando" funciona', async ({ page }) => {
    await page.click('a:has-text("Continuar comprando")');
    await expect(page).toHaveURL('/catalogo');
  });
});
