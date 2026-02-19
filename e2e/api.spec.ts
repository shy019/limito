import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('GET /api/products returns products', async ({ request }) => {
    const res = await request.get('/api/products');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.products).toBeDefined();
    expect(Array.isArray(data.products)).toBe(true);
  });

  test('GET /api/store-config returns config', async ({ request }) => {
    const res = await request.get('/api/store-config');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.mode).toBeDefined();
  });

  test('GET /api/health returns healthy', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.status).toBe('healthy');
    expect(data.services.turso).toBe('ok');
  });

  test('GET /api/products/available-stock returns number', async ({ request }) => {
    const productsRes = await request.get('/api/products');
    const { products } = await productsRes.json();
    if (products.length === 0) return;

    const res = await request.get(`/api/products/available-stock?productId=${products[0].id}`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(typeof data.availableStock).toBe('number');
  });

  test('POST /api/cart/reserve validates quantity', async ({ request }) => {
    const res = await request.post('/api/cart/reserve', {
      data: { productId: 'any', quantity: -1, sessionId: 'test' },
    });
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  test('POST /api/cart/reserve rejects quantity > 5', async ({ request }) => {
    const res = await request.post('/api/cart/reserve', {
      data: { productId: 'any', quantity: 99, sessionId: 'test' },
    });
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  test('admin endpoints require auth', async ({ request }) => {
    const endpoints = [
      { method: 'POST', url: '/api/admin/products', data: { id: 'x' } },
      { method: 'GET', url: '/api/admin/orders' },
      { method: 'POST', url: '/api/store-config', data: { mode: 'active' } },
    ];

    for (const ep of endpoints) {
      const res = ep.method === 'POST'
        ? await request.post(ep.url, { data: ep.data })
        : await request.get(ep.url);
      expect(res.status()).toBe(401);
    }
  });
});
