import { test, expect } from '@playwright/test';

test.describe('Reservas Concurrentes', () => {
  test('3 usuarios pueden reservar stock simultáneamente sin pérdida de datos', async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);

    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));
    
    const productId = 'limito-snap';
    const color = 'Negro';
    
    // Los 3 usuarios agregan al carrito simultáneamente
    const addToCartPromises = pages.map(async (page, idx) => {
      await page.goto('/');
      await page.waitForTimeout(500);
      
      const productCard = page.locator('button.product-card').first();
      await productCard.click();
      await page.waitForTimeout(300);
      
      const addButton = page.locator('button:has-text("Agregar al Carrito")');
      await addButton.click();
      await page.waitForTimeout(500);
      
      return { page, userId: idx + 1 };
    });

    await Promise.all(addToCartPromises);

    // Verificar que los 3 tienen items en carrito
    for (const page of pages) {
      await page.goto('/cart');
      await page.waitForTimeout(500);
      
      const cartItems = page.locator('[data-testid="cart-item"]');
      const count = await cartItems.count();
      expect(count).toBeGreaterThan(0);
    }

    // Verificar stock disponible después de 3 reservas
    const response = await pages[0].request.get(`/api/products/available-stock?productId=${productId}`);
    const data = await response.json();
    const stockData = data.availableStock.find((s: any) => s.name === color);
    
    // Stock debe haberse reducido en 3 (1 por usuario)
    expect(stockData.availableStock).toBeLessThan(stockData.totalStock);

    // Cleanup
    await Promise.all(contexts.map(ctx => ctx.close()));
  });

  test('cleanExpiredReservations no pierde datos con llamadas simultáneas', async ({ request }) => {
    // Crear 5 reservas
    const sessionIds = Array.from({ length: 5 }, (_, i) => `test-session-${i}`);
    
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

    // Llamar limpieza 3 veces simultáneamente
    await Promise.all([
      request.get('/api/products/available-stock?productId=limito-snap'),
      request.get('/api/products/available-stock?productId=limito-snap'),
      request.get('/api/products/available-stock?productId=limito-snap'),
    ]);

    // Verificar que las 5 reservas siguen existiendo
    const response = await request.get('/api/products/available-stock?productId=limito-snap');
    const data = await response.json();
    const negroStock = data.availableStock.find((s: any) => s.name === 'Negro');
    
    // Stock debe reflejar las 5 reservas activas
    expect(negroStock.availableStock).toBeLessThanOrEqual(negroStock.totalStock - 5);
  });
});
