import { test, expect } from '@playwright/test';

test.describe('Flujo Completo LIMITØ', () => {
  test('Usuario puede completar compra desde landing hasta checkout', async ({ page }) => {
    // 1. Landing - Ingresar password
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('LIMITØ');
    
    await page.fill('[data-testid="password-input"]', 'Lmt#2024$9Xp');
    await page.click('[data-testid="access-button"]');
    
    // 2. Catálogo - Verificar redirección
    await expect(page).toHaveURL('/catalogo');
    await expect(page.locator('h1')).toContainText('EDICIÓN 001');
    
    // 3. Verificar productos visibles
    const products = page.locator('.product-card');
    await expect(products).toHaveCount(3);
    
    // 4. Verificar icono de carrito en header
    const cartIcon = page.locator('a[href="/carrito"]');
    await expect(cartIcon).toBeVisible();
    
    // 5. Click en primer producto
    await products.first().click();
    await page.waitForTimeout(500);
    
    // 6. Modal de producto - Verificar elementos
    await expect(page.locator('h1')).toContainText('EDITION 001');
    
    // 7. Seleccionar color (si hay múltiples)
    const colorButtons = page.locator('button[style*="borderRadius"]').filter({ hasText: '' });
    if (await colorButtons.count() > 1) {
      await colorButtons.nth(1).click();
    }
    
    // 8. Agregar al carrito
    const addButton = page.locator('button:has-text("AGREGAR AL CARRITO"), button:has-text("Agregar al carrito")');
    await addButton.click();
    
    // 9. Esperar confirmación
    await page.waitForTimeout(1000);
    
    // 10. Verificar botón "Ir al carrito" aparece
    const goToCartButton = page.locator('button:has-text("IR AL CARRITO"), button:has-text("Ir al carrito")');
    await expect(goToCartButton).toBeVisible();
    
    // 11. Click en "Ir al carrito"
    await goToCartButton.click();
    
    // 12. Carrito - Verificar URL
    await expect(page).toHaveURL('/carrito');
    
    // 13. Verificar producto en carrito
    await expect(page.locator('h1')).toContainText('Tu Carrito');
    await expect(page.locator('h3')).toContainText('LIMITØ');
    
    // 14. Verificar precio visible
    const price = page.locator('text=/\\$[0-9,]+/').first();
    await expect(price).toBeVisible();
    
    // 15. Aplicar código promocional
    await page.fill('input[placeholder*="CODIGO"]', 'FIRST10');
    await page.click('button:has-text("Aplicar")');
    await page.waitForTimeout(500);
    
    // 16. Verificar descuento aplicado
    await expect(page.locator('text=/Descuento|discount/i')).toBeVisible();
    
    // 17. Verificar botón de checkout
    const checkoutButton = page.locator('button:has-text("PROCEDER AL PAGO"), button:has-text("Proceder al pago")');
    await expect(checkoutButton).toBeVisible();
    await expect(checkoutButton).toBeEnabled();
  });

  test('Contador de carrito se actualiza correctamente', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('[data-testid="password-input"]', 'Lmt#2024$9Xp');
    await page.click('[data-testid="access-button"]');
    await expect(page).toHaveURL('/catalogo');
    
    // Verificar contador inicial (0 o vacío)
    const cartBadge = page.locator('a[href="/carrito"] span');
    
    // Agregar producto
    await page.locator('.product-card').first().click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("AGREGAR AL CARRITO"), button:has-text("Agregar al carrito")').click();
    await page.waitForTimeout(1500);
    
    // Cerrar modal
    await page.locator('button').first().click();
    await page.waitForTimeout(500);
    
    // Verificar contador actualizado
    await expect(cartBadge).toContainText('1');
  });

  test('Código promocional inválido muestra error', async ({ page }) => {
    // Setup: agregar producto al carrito
    await page.goto('/');
    await page.fill('[data-testid="password-input"]', 'Lmt#2024$9Xp');
    await page.click('[data-testid="access-button"]');
    await page.locator('.product-card').first().click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("AGREGAR AL CARRITO")').click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("IR AL CARRITO")').click();
    
    // Aplicar código inválido
    await page.fill('input[placeholder*="CODIGO"]', 'INVALID123');
    await page.click('button:has-text("Aplicar")');
    await page.waitForTimeout(500);
    
    // Verificar mensaje de error
    await expect(page.locator('text=/inválido|expirado|agotado/i')).toBeVisible();
  });

  test('Admin puede acceder al panel', async ({ page }) => {
    await page.goto('/admin');
    
    // Verificar formulario de login
    await expect(page.locator('h1')).toContainText('ADMIN PANEL');
    
    // Ingresar password
    await page.fill('input[type="password"]', 'Adm!Lmt@7K9z');
    await page.click('button:has-text("ACCEDER")');
    await page.waitForTimeout(500);
    
    // Verificar acceso
    await expect(page.locator('h1')).toContainText('LIMITØ ADMIN');
    
    // Verificar tabs
    await expect(page.locator('button:has-text("Productos")')).toBeVisible();
    await expect(page.locator('button:has-text("Configuración")')).toBeVisible();
    
    // Verificar productos listados
    await expect(page.locator('text=/LIMITØ SNAP|LIMITØ DAD|LIMITØ TRUCKER/i')).toBeVisible();
  });

  test('Carrito vacío muestra mensaje correcto', async ({ page }) => {
    await page.goto('/carrito');
    
    // Verificar mensaje de carrito vacío
    await expect(page.locator('text=/vacío|empty/i')).toBeVisible();
    
    // Verificar botón para continuar comprando
    await expect(page.locator('a[href="/catalogo"]')).toBeVisible();
  });

  test('Usuario puede ajustar cantidad en carrito', async ({ page }) => {
    // Setup: agregar producto
    await page.goto('/');
    await page.fill('[data-testid="password-input"]', 'Lmt#2024$9Xp');
    await page.click('[data-testid="access-button"]');
    await page.locator('.product-card').first().click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("AGREGAR AL CARRITO")').click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("IR AL CARRITO")').click();
    
    // Incrementar cantidad
    const plusButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    await plusButton.click();
    await page.waitForTimeout(300);
    
    // Verificar cantidad actualizada
    const quantityDisplay = page.locator('span.font-bold').filter({ hasText: /^[0-9]$/ });
    await expect(quantityDisplay).toContainText('2');
  });

  test('Password incorrecta muestra error', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="access-button"]');
    await page.waitForTimeout(500);
    
    // Verificar mensaje de error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/incorrecto|incorrect/i);
  });

  test('Newsletter permite suscripción', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('[data-testid="newsletter-email"]', 'test@example.com');
    await page.click('[data-testid="newsletter-submit"]');
    await page.waitForTimeout(500);
    
    // Verificar mensaje de éxito
    await expect(page.locator('text=/Gracias|Thank you|success/i')).toBeVisible();
  });
});
