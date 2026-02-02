import { test, expect } from '@playwright/test';

test.describe('Panel de Administración', () => {
  test('Admin puede acceder desde página principal con código de admin', async ({ page }) => {
    await page.goto('/');
    
    // Ingresar código de admin en página principal
    await page.fill('input[type="password"]', 'Adm!Lmt@7K9z');
    await page.click('button[data-testid="access-button"]');
    await page.waitForURL('/admin');
    
    // Debe estar en el panel sin pedir contraseña de nuevo
    await expect(page.locator('h1')).toContainText('LIMITØ ADMIN');
    await expect(page.locator('text=/Gestión de Productos/i')).toBeVisible();
  });

  test('Acceso directo a /admin sin sesión redirige a home', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
  });

  test('Admin no puede acceder con password incorrecta', async ({ page }) => {
    await page.goto('/admin');
    
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("ACCEDER")');
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=/incorrecto|incorrect/i')).toBeVisible();
  });

  test('Sesión de admin persiste al navegar', async ({ page }) => {
    // Login desde página principal
    await page.goto('/');
    await page.fill('input[type="password"]', 'Adm!Lmt@7K9z');
    await page.click('button[data-testid="access-button"]');
    await page.waitForURL('/admin');
    
    // Navegar a otra página y volver
    await page.goto('/');
    await page.goto('/admin');
    
    // Debe seguir autenticado
    await expect(page.locator('h1')).toContainText('LIMITØ ADMIN');
  });

  test('Panel muestra todos los productos', async ({ page }) => {
    await page.goto('/admin');
    await page.fill('input[type="password"]', 'Adm!Lmt@7K9z');
    await page.click('button:has-text("ACCEDER")');
    await page.waitForTimeout(500);
    
    // Verificar que muestra productos
    await expect(page.locator('text=/LIMITØ SNAP/i')).toBeVisible();
    await expect(page.locator('text=/LIMITØ DAD/i')).toBeVisible();
    await expect(page.locator('text=/LIMITØ TRUCKER/i')).toBeVisible();
  });

  test('Panel muestra información de stock', async ({ page }) => {
    await page.goto('/admin');
    await page.fill('input[type="password"]', 'Adm!Lmt@7K9z');
    await page.click('button:has-text("ACCEDER")');
    await page.waitForTimeout(500);
    
    // Verificar que muestra stock
    await expect(page.locator('text=/Stock:/i')).toBeVisible();
    await expect(page.locator('text=/Disponible|No disponible/i')).toBeVisible();
  });

  test('Puede cambiar entre tabs Productos y Configuración', async ({ page }) => {
    await page.goto('/admin');
    await page.fill('input[type="password"]', 'Adm!Lmt@7K9z');
    await page.click('button:has-text("ACCEDER")');
    await page.waitForTimeout(500);
    
    // Click en Configuración
    await page.click('button:has-text("Configuración")');
    await page.waitForTimeout(300);
    
    await expect(page.locator('text=/Modo de tienda/i')).toBeVisible();
    await expect(page.locator('select')).toBeVisible();
    
    // Volver a Productos
    await page.click('button:has-text("Productos")');
    await page.waitForTimeout(300);
    
    await expect(page.locator('text=/LIMITØ SNAP/i')).toBeVisible();
  });

  test('Botón de logout redirige a página principal', async ({ page }) => {
    // Login desde página principal
    await page.goto('/');
    await page.fill('input[type="password"]', 'Adm!Lmt@7K9z');
    await page.click('button[data-testid="access-button"]');
    await page.waitForURL('/admin');
    
    // Click en logout
    await page.click('button:has-text("Salir")');
    await page.waitForURL('/');
    
    // Debe estar en home
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('LIMITØ');
  });

  test('Tab Configuración muestra opciones correctas', async ({ page }) => {
    await page.goto('/admin');
    await page.fill('input[type="password"]', 'Adm!Lmt@7K9z');
    await page.click('button:has-text("ACCEDER")');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Configuración")');
    await page.waitForTimeout(300);
    
    // Verificar select de modo
    const select = page.locator('select');
    await expect(select).toBeVisible();
    
    const options = await select.locator('option').allTextContents();
    expect(options).toContain('Password (Pre-lanzamiento)');
    expect(options).toContain('Activo (Ventas abiertas)');
    expect(options).toContain('Sold Out (Agotado)');
    
    // Verificar input de fecha
    await expect(page.locator('input[type="datetime-local"]')).toBeVisible();
    
    // Verificar botón guardar
    await expect(page.locator('button:has-text("Guardar Cambios")')).toBeVisible();
  });

  test('Productos muestran precios correctamente', async ({ page }) => {
    await page.goto('/admin');
    await page.fill('input[type="password"]', 'Adm!Lmt@7K9z');
    await page.click('button:has-text("ACCEDER")');
    await page.waitForTimeout(500);
    
    // Verificar que hay precios visibles
    await expect(page.locator('text=/\\$[0-9,]+/')).toBeVisible();
  });

  test('Productos muestran edición correctamente', async ({ page }) => {
    await page.goto('/admin');
    await page.fill('input[type="password"]', 'Adm!Lmt@7K9z');
    await page.click('button:has-text("ACCEDER")');
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=/Edición: 001/i')).toBeVisible();
  });
});
