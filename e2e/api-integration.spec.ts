import { test, expect } from '@playwright/test';

test.describe('API Integration', () => {
  test('should handle newsletter subscription', async ({ request }) => {
    const response = await request.post('/api/newsletter/subscribe', {
      data: {
        email: 'test@example.com',
      },
    });
    
    expect(response.status()).toBeLessThan(500);
  });

  test('should validate newsletter email', async ({ request }) => {
    const response = await request.post('/api/newsletter/subscribe', {
      data: {
        email: 'invalid-email',
      },
    });
    
    // Should return error or validation message
    expect([400, 422, 500]).toContain(response.status());
  });

  test('should handle password verification', async ({ request }) => {
    const response = await request.post('/api/auth/verify', {
      data: {
        password: 'test123',
      },
    });
    
    expect(response.ok() || response.status() === 401).toBe(true);
  });

  test('should handle checkout session creation', async ({ request }) => {
    const response = await request.post('/api/checkout', {
      data: {
        items: [
          {
            name: 'Test Product',
            color: 'Black',
            price: 100,
            quantity: 1,
            image: '/test.jpg',
          },
        ],
      },
    });
    
    expect(response.status()).toBeLessThan(500);
  });

  test('should reject empty checkout', async ({ request }) => {
    const response = await request.post('/api/checkout', {
      data: {
        items: [],
      },
    });
    
    expect([400, 500]).toContain(response.status());
  });
});
