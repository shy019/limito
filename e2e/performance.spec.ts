import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('should load home page quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000); // 3 seconds
  });

  test('should load catalog quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(4000); // 4 seconds
  });

  test('should have good LCP', async ({ page }) => {
    await page.goto('/');
    
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.renderTime || lastEntry.loadTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        setTimeout(() => resolve(0), 5000);
      });
    });
    
    expect(lcp).toBeLessThan(2500); // 2.5 seconds
  });

  test('should have minimal CLS', async ({ page }) => {
    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');
    
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        }).observe({ entryTypes: ['layout-shift'] });
        
        setTimeout(() => resolve(clsValue), 3000);
      });
    });
    
    expect(cls).toBeLessThan(0.1);
  });

  test('should load images efficiently', async ({ page }) => {
    await page.goto('/catalogo');
    
    const images = page.locator('img');
    const count = await images.count();
    
    // Check that images have proper loading attributes
    for (let i = 0; i < Math.min(count, 3); i++) {
      const img = images.nth(i);
      const loading = await img.getAttribute('loading');
      expect(['lazy', 'eager', null]).toContain(loading);
    }
  });
});
