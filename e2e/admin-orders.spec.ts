import { test, expect } from '@playwright/test';

test.describe('Admin Orders Management', () => {
  test.beforeEach(async ({ page, context }) => {
    test.setTimeout(90000);
    await page.goto('/');
    await page.fill('input[type="password"]', 'Adm!Lmt@7K9z');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin', { timeout: 60000 });
    await page.waitForLoadState('networkidle');
  });

  test('should display orders tab', async ({ page }) => {
    await expect(page.locator('button:has-text("ÓRDENES")')).toBeVisible();
    await page.click('button:has-text("ÓRDENES")');
    
    await expect(page.locator('h2:has-text("Gestión de Órdenes")')).toBeVisible();
  });

  test('should display order statistics', async ({ page }) => {
    await page.click('button:has-text("ÓRDENES")');
    
    await expect(page.locator('text=Total Órdenes')).toBeVisible();
    await expect(page.locator('text=Ingresos Totales')).toBeVisible();
    await expect(page.locator('text=Pendientes')).toBeVisible();
  });

  test('should display empty state when no orders', async ({ page }) => {
    await page.route('/api/admin/orders', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ orders: [], metadata: { totalOrders: 0 } }),
      });
    });

    await page.reload();
    await page.click('button:has-text("ÓRDENES")');
    
    await expect(page.locator('text=No hay órdenes aún')).toBeVisible();
  });

  test('should display order details', async ({ page }) => {
    const mockOrder = {
      id: 'LMT-123456',
      status: 'pending',
      customerName: 'Juan Pérez',
      customerEmail: 'juan@example.com',
      customerPhone: '+57 300 1234567',
      total: 55000,
      items: [{ name: 'LIMITØ SNAP', color: 'Black', quantity: 1 }],
      shippingAddress: {
        line1: 'Calle 123 #45-67',
        city: 'Bogotá',
        state: 'Cundinamarca'
      },
      createdAt: new Date().toISOString()
    };

    await page.route('/api/admin/orders', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ 
          orders: [mockOrder], 
          metadata: { totalOrders: 1 } 
        }),
      });
    });

    await page.reload();
    await page.click('button:has-text("ÓRDENES")');
    
    await expect(page.locator('text=#LMT-123456')).toBeVisible();
    await expect(page.locator('text=Juan Pérez')).toBeVisible();
    await expect(page.locator('text=$55,000')).toBeVisible();
  });

  test('should update order status', async ({ page }) => {
    const mockOrder = {
      id: 'LMT-123456',
      status: 'pending',
      customerName: 'Juan Pérez',
      customerEmail: 'juan@example.com',
      total: 55000,
      items: [],
      shippingAddress: { line1: '', city: '', state: '' },
      createdAt: new Date().toISOString()
    };

    await page.route('/api/admin/orders', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ orders: [mockOrder], metadata: { totalOrders: 1 } }),
      });
    });

    await page.route('/api/admin/orders/update', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
      });
    });

    await page.reload();
    await page.click('button:has-text("ÓRDENES")');
    
    const statusSelect = page.locator('select').first();
    await statusSelect.selectOption('shipped');
    
    await page.waitForTimeout(500);
  });

  test('should add tracking number', async ({ page }) => {
    const mockOrder = {
      id: 'LMT-123456',
      status: 'pending',
      customerName: 'Juan Pérez',
      customerEmail: 'juan@example.com',
      total: 55000,
      items: [],
      shippingAddress: { line1: '', city: '', state: '' },
      createdAt: new Date().toISOString(),
      trackingNumber: null
    };

    await page.route('/api/admin/orders', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ orders: [mockOrder], metadata: { totalOrders: 1 } }),
      });
    });

    await page.route('/api/admin/orders/update', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
      });
    });

    await page.reload();
    await page.click('button:has-text("ÓRDENES")');
    
    const trackingInput = page.locator('input[placeholder="Número de guía"]');
    await trackingInput.fill('123456789');
    await trackingInput.blur();
    
    await page.waitForTimeout(500);
  });

  test('should switch between tabs', async ({ page }) => {
    await page.click('button:has-text("ÓRDENES")');
    await expect(page.locator('h2:has-text("Gestión de Órdenes")')).toBeVisible();
    
    await page.click('button:has-text("PRODUCTOS")');
    await expect(page.locator('h2:has-text("Gestión de Productos")')).toBeVisible();
    
    await page.click('button:has-text("CONFIGURACIÓN")');
    await expect(page.locator('h2:has-text("Configuración General")')).toBeVisible();
  });
});
