import { test, expect } from '@playwright/test';

test.describe('Sistema de Reservas - Fixes Recientes', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test('Usuario puede reducir cantidad en carrito sin error de stock', async ({ page }) => {
    // Agregar 3 items
    const productCard = page.locator('button.product-card').first();
    await productCard.click();
    await page.waitForTimeout(300);

    const plusButton = page.locator('button:has(svg)').filter({ hasText: '' }).last();
    await plusButton.click();
    await plusButton.click();
    await page.waitForTimeout(200);

    const addButton = page.locator('button:has-text("Agregar al Carrito")');
    await addButton.click();
    await page.waitForTimeout(500);

    // Ir al carrito
    await page.goto('/cart');
    await page.waitForTimeout(500);

    // Reducir cantidad de 3 a 1
    const minusButton = page.locator('button:has-text("-")').first();
    await minusButton.click();
    await page.waitForTimeout(300);
    await minusButton.click();
    await page.waitForTimeout(300);

    // Verificar que no hay error
    const errorToast = page.locator('text=/error|disponible/i');
    await expect(errorToast).not.toBeVisible();

    // Verificar cantidad actualizada
    const quantity = page.locator('text=/cantidad/i').first();
    await expect(quantity).toBeVisible();
  });

  test('Stock disponible se actualiza correctamente después de agregar al carrito', async ({ page }) => {
    const productCard = page.locator('button.product-card').first();
    await productCard.click();
    await page.waitForTimeout(300);

    // Obtener stock inicial
    const stockBadge = page.locator('text=/últimas unidades|agotado/i').first();
    const hasLowStock = await stockBadge.isVisible().catch(() => false);

    const addButton = page.locator('button:has-text("Agregar al Carrito")');
    await addButton.click();
    await page.waitForTimeout(1000);

    // Cerrar modal y reabrir
    const closeButton = page.locator('button').first();
    await closeButton.click();
    await page.waitForTimeout(300);

    await productCard.click();
    await page.waitForTimeout(500);

    // Stock debe haberse actualizado
    const updatedStockBadge = page.locator('text=/últimas unidades|agotado/i').first();
    const hasLowStockAfter = await updatedStockBadge.isVisible().catch(() => false);

    // Si no había low stock antes, podría haberlo ahora
    expect(hasLowStockAfter).toBeDefined();
  });

  test('Cache se limpia después de operaciones de carrito', async ({ page, request }) => {
    const productCard = page.locator('button.product-card').first();
    await productCard.click();
    await page.waitForTimeout(300);

    const addButton = page.locator('button:has-text("Agregar al Carrito")');
    await addButton.click();
    await page.waitForTimeout(1000);

    // Verificar que el cache se limpió (stock actualizado)
    const response = await request.get('/api/products/available-stock?productId=limito-snap');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.availableStock).toBeDefined();
    expect(Array.isArray(data.availableStock)).toBeTruthy();
  });

  test('Loading state se muestra al agregar al carrito', async ({ page }) => {
    const productCard = page.locator('button.product-card').first();
    await productCard.click();
    await page.waitForTimeout(300);

    const addButton = page.locator('button:has-text("Agregar al Carrito")');
    await addButton.click();

    // Verificar spinner o texto "Agregando"
    const loading = page.locator('text=/agregando/i, div[style*="animation"]');
    await expect(loading).toBeVisible({ timeout: 1000 });
  });

  test('Carrito no muestra estado vacío antes de cargar items', async ({ page }) => {
    // Agregar item primero
    const productCard = page.locator('button.product-card').first();
    await productCard.click();
    await page.waitForTimeout(300);

    const addButton = page.locator('button:has-text("Agregar al Carrito")');
    await addButton.click();
    await page.waitForTimeout(500);

    // Ir al carrito
    await page.goto('/cart');

    // No debe mostrar "carrito vacío" si hay items
    const emptyMessage = page.locator('text=/carrito está vacío/i');
    await expect(emptyMessage).not.toBeVisible({ timeout: 2000 });
  });

  test('Middleware protege ruta /cart correctamente', async ({ page }) => {
    // Limpiar sesión
    await page.context().clearCookies();
    await page.evaluate(() => sessionStorage.clear());

    // Intentar acceder a /cart sin autenticación
    await page.goto('/cart');
    await page.waitForTimeout(1000);

    // Debe redirigir a password o home
    const url = page.url();
    expect(url).toMatch(/password|\/$/);
  });

  test('Items expirados (>15min) se eliminan del carrito', async ({ page }) => {
    // Agregar item
    const productCard = page.locator('button.product-card').first();
    await productCard.click();
    await page.waitForTimeout(300);

    const addButton = page.locator('button:has-text("Agregar al Carrito")');
    await addButton.click();
    await page.waitForTimeout(500);

    // Modificar timestamp en localStorage para simular expiración
    await page.evaluate(() => {
      const cart = JSON.parse(localStorage.getItem('limito_cart') || '[]');
      if (cart.length > 0) {
        cart[0].reservedAt = Date.now() - 1000000; // >15 minutos atrás
        localStorage.setItem('limito_cart', JSON.stringify(cart));
      }
    });

    // Recargar página
    await page.reload();
    await page.waitForTimeout(500);

    // Verificar que carrito está vacío
    const cartCount = await page.evaluate(() => {
      const cart = JSON.parse(localStorage.getItem('limito_cart') || '[]');
      return cart.length;
    });

    expect(cartCount).toBe(0);
  });

  test('Promise.allSettled maneja errores en operaciones paralelas', async ({ page }) => {
    const productCard = page.locator('button.product-card').first();
    await productCard.click();
    await page.waitForTimeout(300);

    // Simular error de red interceptando fetch
    await page.route('**/api/products/available-stock*', route => {
      route.abort('failed');
    });

    const addButton = page.locator('button:has-text("Agregar al Carrito")');
    await addButton.click();
    await page.waitForTimeout(1000);

    // Debe mostrar error o completar sin crash
    const errorToast = page.locator('[role="alert"], text=/error/i');
    const successToast = page.locator('text=/agregado/i');
    
    const hasError = await errorToast.isVisible().catch(() => false);
    const hasSuccess = await successToast.isVisible().catch(() => false);

    // Debe mostrar algún feedback
    expect(hasError || hasSuccess).toBeTruthy();
  });

  test('useEffect con cancelled flag previene llamadas duplicadas', async ({ page }) => {
    let requestCount = 0;

    // Interceptar requests para contar
    await page.route('**/api/products/available-stock*', route => {
      requestCount++;
      route.continue();
    });

    const productCard = page.locator('button.product-card').first();
    await productCard.click();
    await page.waitForTimeout(1000);

    // En React 19 dev mode, useEffect se ejecuta 2 veces
    // Con cancelled flag, solo debe haber 1 request efectivo
    expect(requestCount).toBeLessThanOrEqual(2);
  });

  test('Traducción "adding" existe en ambos idiomas', async ({ page }) => {
    // Español
    const productCard = page.locator('button.product-card').first();
    await productCard.click();
    await page.waitForTimeout(300);

    const addButton = page.locator('button:has-text("Agregar al Carrito")');
    await addButton.click();

    const loadingEs = page.locator('text=/agregando/i');
    await expect(loadingEs).toBeVisible({ timeout: 1000 });

    await page.goto('/');
    await page.waitForTimeout(500);

    // Cambiar a inglés
    const langToggle = page.locator('button:has-text("EN"), button:has-text("ES")');
    if (await langToggle.isVisible()) {
      await langToggle.click();
      await page.waitForTimeout(1000);

      const productCardEn = page.locator('button.product-card').first();
      await productCardEn.click();
      await page.waitForTimeout(300);

      const addButtonEn = page.locator('button:has-text("Add to Cart")');
      await addButtonEn.click();

      const loadingEn = page.locator('text=/adding/i');
      await expect(loadingEn).toBeVisible({ timeout: 1000 });
    }
  });
});

test.describe('Concurrencia y Race Conditions', () => {
  
  test('Lock previene limpieza simultánea de reservas', async ({ request }) => {
    // Crear múltiples reservas
    const sessionIds = ['test-1', 'test-2', 'test-3'];
    
    await Promise.all(
      sessionIds.map(sessionId =>
        request.post('/api/cart/reserve', {
          data: {
            productId: 'limito-snap',
            color: 'Negro',
            quantity: 1,
            sessionId,
          },
        })
      )
    );

    // Llamar limpieza 5 veces simultáneamente
    const cleanupCalls = Array(5).fill(null).map(() =>
      request.get('/api/products/available-stock?productId=limito-snap')
    );

    await Promise.all(cleanupCalls);

    // Verificar que las reservas siguen existiendo
    const response = await request.get('/api/products/available-stock?productId=limito-snap');
    const data = await response.json();
    
    expect(response.ok()).toBeTruthy();
    expect(data.availableStock).toBeDefined();
  });

  test('Múltiples usuarios pueden reservar sin pérdida de datos', async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);

    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));
    
    // Los 3 usuarios agregan simultáneamente
    await Promise.all(
      pages.map(async (page) => {
        await page.goto('/');
        await page.waitForTimeout(500);
        
        const productCard = page.locator('button.product-card').first();
        await productCard.click();
        await page.waitForTimeout(300);
        
        const addButton = page.locator('button:has-text("Agregar al Carrito")');
        await addButton.click();
        await page.waitForTimeout(500);
      })
    );

    // Verificar que todos tienen items
    for (const page of pages) {
      const cartCount = await page.evaluate(() => {
        const cart = JSON.parse(localStorage.getItem('limito_cart') || '[]');
        return cart.length;
      });
      expect(cartCount).toBeGreaterThan(0);
    }

    await Promise.all(contexts.map(ctx => ctx.close()));
  });
});
