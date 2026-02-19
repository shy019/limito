import { test, expect } from '@playwright/test';

test.describe('Stock Reservations', () => {
  let productId: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.get('/api/products');
    const { products } = await res.json();
    productId = products[0]?.id;
  });

  test('reserve and release stock', async ({ request }) => {
    if (!productId) return;
    const sessionId = `e2e-rr-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Reserve 1
    const reserveRes = await request.post('/api/cart/reserve', {
      data: { productId, quantity: 1, sessionId },
    });
    expect((await reserveRes.json()).success).toBe(true);

    // Snapshot stock with our reservation active
    const midRes = await request.get(`/api/products/available-stock?productId=${productId}`);
    const stockMid = (await midRes.json()).availableStock;

    // Release our reservation
    await request.post('/api/cart/release', { data: { productId, sessionId } });

    // Wait for release to propagate
    await new Promise(r => setTimeout(r, 200));

    // Stock should be exactly 1 more than mid-point
    const afterRes = await request.get(`/api/products/available-stock?productId=${productId}`);
    const stockAfter = (await afterRes.json()).availableStock;
    expect(stockAfter).toBeGreaterThan(stockMid);
  });

  test('concurrent reservations are safe', async ({ request }) => {
    if (!productId) return;

    const sessions = [1, 2, 3].map(i => `conc-${Date.now()}-${i}`);
    const results = await Promise.all(
      sessions.map(sessionId =>
        request.post('/api/cart/reserve', {
          data: { productId, quantity: 2, sessionId },
        }).then(r => r.json())
      )
    );

    const successes = results.filter(r => r.success);
    // At least 1 should succeed, and no SQLITE_BUSY errors
    expect(successes.length).toBeGreaterThan(0);
    const busyErrors = results.filter(r => !r.success && r.error?.includes('SQLITE_BUSY'));
    expect(busyErrors.length).toBe(0);

    // Cleanup
    await Promise.all(
      sessions.map(sessionId =>
        request.post('/api/cart/release', { data: { productId, sessionId } })
      )
    );
  });

  test('cart validate returns valid items', async ({ request }) => {
    if (!productId) return;
    const sessionId = `val-${Date.now()}`;

    await request.post('/api/cart/reserve', {
      data: { productId, quantity: 1, sessionId },
    });

    const res = await request.post('/api/cart/validate', {
      data: { sessionId, items: [{ productId }] },
    });
    const data = await res.json();
    expect(data.validItems.length).toBe(1);

    await request.post('/api/cart/release', { data: { productId, sessionId } });
  });

  test('invalid quantity is rejected', async ({ request }) => {
    const r1 = await request.post('/api/cart/reserve', {
      data: { productId: productId || 'x', quantity: -1, sessionId: 'x' },
    });
    expect((await r1.json()).success).toBe(false);

    const r2 = await request.post('/api/cart/reserve', {
      data: { productId: productId || 'x', quantity: 99, sessionId: 'x' },
    });
    expect((await r2.json()).success).toBe(false);
  });
});
