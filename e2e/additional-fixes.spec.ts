import { test, expect } from '@playwright/test';

test.describe('Fixes Adicionales', () => {
  
  test('SessionId usa crypto.randomUUID()', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    const sessionId = await page.evaluate(() => {
      return sessionStorage.getItem('limito_session_id');
    });

    // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  test('Rate limiting en available-stock endpoint', async ({ request }) => {
    const requests = Array(65).fill(null).map(() =>
      request.get('/api/products/available-stock?productId=limito-snap')
    );

    const results = await Promise.all(requests);
    const rateLimited = results.filter(r => r.status() === 429);

    expect(rateLimited.length).toBeGreaterThan(0);
  });

  test('Health check endpoint funciona', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.services.googleSheets).toBe('ok');
  });
});
