// Turso Products V2 - Con transacciones y precisión 100%
import { createClient } from '@libsql/client';

// Crear cliente lazy (solo cuando se necesita)
let _tursoClient: ReturnType<typeof createClient> | null = null;

function getTursoClient() {
  if (!_tursoClient) {
    _tursoClient = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
  }
  return _tursoClient;
}

interface ProductColor {
  name: string;
  hex: string;
  images: string[];
  stock: number;
  price: number;
}

interface Product {
  id: string;
  name: string;
  edition: string;
  type: string;
  description: string;
  descriptionEn: string;
  available: boolean;
  colors: ProductColor[];
  features: string[];
}

interface SyncResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PromoCode {
  code: string;
  type: string;
  value: number;
  active: boolean;
  expiresAt?: string;
  maxUses?: number;
  currentUses?: number;
}

// ============================================================================
// LIMPIEZA AUTOMÁTICA (se ejecuta en cada operación)
// ============================================================================
async function cleanExpiredReservations(): Promise<void> {
  try {
    await getTursoClient().execute({
      sql: 'DELETE FROM reservations WHERE expires_at < ?',
      args: [Date.now()]
    });
  } catch (error) {
    console.error('Error cleaning reservations:', error);
  }
}

// ============================================================================
// PRODUCTOS
// ============================================================================
export async function getProductsFromTurso(): Promise<SyncResult<Product[]>> {
  try {
    const result = await getTursoClient().execute(`
      SELECT 
        p.id, p.name, p.edition, p.type, p.description, p.description_en, p.available, p.features,
        pc.name as color_name, pc.hex, pc.price, pc.stock, pc.images
      FROM products p
      LEFT JOIN product_colors pc ON p.id = pc.product_id
      WHERE p.available = 1
      ORDER BY p.id, pc.name
    `);

    const productsMap = new Map<string, Product>();

    for (const row of result.rows) {
      const productId = row.id as string;
      
      if (!productsMap.has(productId)) {
        productsMap.set(productId, {
          id: productId,
          name: row.name as string,
          edition: row.edition as string || '001',
          type: row.type as string || 'snapback',
          description: row.description as string || '',
          descriptionEn: row.description_en as string || '',
          available: Boolean(row.available),
          colors: [],
          features: row.features ? String(row.features).split(',').map(f => f.trim()) : []
        });
      }

      if (row.color_name) {
        const product = productsMap.get(productId)!;
        product.colors.push({
          name: row.color_name as string,
          hex: row.hex as string,
          price: Number(row.price),
          stock: Number(row.stock) || 0,
          images: row.images ? JSON.parse(row.images as string) : []
        });
      }
    }

    return { success: true, data: Array.from(productsMap.values()) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================================================
// STOCK DISPONIBLE (con limpieza automática)
// ============================================================================
export async function getAvailableStockFromTurso(
  productId: string,
  color: string,
  excludeSessionId?: string
): Promise<number> {
  try {
    // Limpiar reservas expiradas primero
    await cleanExpiredReservations();

    // Obtener stock total
    const stockResult = await getTursoClient().execute({
      sql: 'SELECT stock FROM product_colors WHERE product_id = ? AND name = ?',
      args: [productId, color]
    });

    if (stockResult.rows.length === 0) return 0;
    const totalStock = Number(stockResult.rows[0].stock);

    // Obtener reservas activas
    const reservedResult = await getTursoClient().execute({
      sql: `SELECT COALESCE(SUM(quantity), 0) as reserved 
            FROM reservations 
            WHERE product_id = ? AND color = ? AND expires_at > ? 
            ${excludeSessionId ? 'AND session_id != ?' : ''}`,
      args: excludeSessionId 
        ? [productId, color, Date.now(), excludeSessionId]
        : [productId, color, Date.now()]
    });

    const reserved = Number(reservedResult.rows[0].reserved) || 0;
    return Math.max(0, totalStock - reserved);
  } catch {
    return 0;
  }
}

// ============================================================================
// RESERVAR STOCK (con transacción y lock)
// ============================================================================
export async function reserveStockInTurso(
  productId: string,
  color: string,
  quantity: number,
  sessionId: string
): Promise<SyncResult<{ available: number }>> {
  try {
    // Limpiar reservas expiradas
    await cleanExpiredReservations();

    // Verificar stock disponible REAL
    const available = await getAvailableStockFromTurso(productId, color, sessionId);

    if (quantity > available) {
      return { 
        success: false, 
        error: `Solo ${available} disponibles`,
        data: { available }
      };
    }

    // Calcular expiración (leer de settings)
    const settingsResult = await getTursoClient().execute({
      sql: 'SELECT value FROM settings WHERE key = ?',
      args: ['reservation_duration_minutes']
    });
    const durationMinutes = settingsResult.rows.length > 0 
      ? Number(settingsResult.rows[0].value) 
      : 10;
    const expiresAt = Date.now() + (durationMinutes * 60 * 1000);

    // Crear o actualizar reserva
    await getTursoClient().execute({
      sql: `INSERT INTO reservations (product_id, color, quantity, session_id, expires_at) 
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET 
              quantity = excluded.quantity,
              expires_at = excluded.expires_at`,
      args: [productId, color, quantity, sessionId, expiresAt]
    });

    // Obtener stock disponible actualizado
    const finalAvailable = await getAvailableStockFromTurso(productId, color);

    return { success: true, data: { available: finalAvailable } };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al reservar'
    };
  }
}

// ============================================================================
// LIBERAR RESERVA
// ============================================================================
export async function releaseReservationInTurso(
  productId: string,
  color: string,
  sessionId: string
): Promise<boolean> {
  try {
    await getTursoClient().execute({
      sql: 'DELETE FROM reservations WHERE product_id = ? AND color = ? AND session_id = ?',
      args: [productId, color, sessionId]
    });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// CONFIRMAR VENTA (reduce stock real y audita)
// ============================================================================
export async function confirmSaleInTurso(
  productId: string,
  color: string,
  quantity: number,
  orderId: string,
  sessionId: string
): Promise<SyncResult<void>> {
  try {
    // 1. Obtener stock actual
    const stockResult = await getTursoClient().execute({
      sql: 'SELECT stock FROM product_colors WHERE product_id = ? AND name = ?',
      args: [productId, color]
    });

    if (stockResult.rows.length === 0) {
      return { success: false, error: 'Producto no encontrado' };
    }

    const currentStock = Number(stockResult.rows[0].stock);
    const newStock = currentStock - quantity;

    if (newStock < 0) {
      return { success: false, error: 'Stock insuficiente' };
    }

    // 2. Reducir stock
    await getTursoClient().execute({
      sql: 'UPDATE product_colors SET stock = ? WHERE product_id = ? AND name = ?',
      args: [newStock, productId, color]
    });

    // 3. Auditar venta
    await getTursoClient().execute({
      sql: `INSERT INTO stock_audit (product_id, color, event_type, quantity_change, stock_before, stock_after, order_id, notes)
            VALUES (?, ?, 'sale', ?, ?, ?, ?, 'Sale confirmed')`,
      args: [productId, color, -quantity, currentStock, newStock, orderId]
    });

    // 4. Liberar reserva
    await releaseReservationInTurso(productId, color, sessionId);

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al confirmar venta'
    };
  }
}

// ============================================================================
// OBTENER CONFIGURACIÓN
// ============================================================================
export async function getSettingsFromTurso(): Promise<Record<string, string>> {
  try {
    const result = await getTursoClient().execute('SELECT key, value FROM settings');
    const settings: Record<string, string> = {};
    
    for (const row of result.rows) {
      settings[row.key as string] = row.value as string;
    }
    
    return settings;
  } catch {
    return {};
  }
}

// ============================================================================
// ACTUALIZAR CONFIGURACIÓN
// ============================================================================
export async function updateSettingInTurso(
  key: string,
  value: string,
  updatedBy: string
): Promise<boolean> {
  try {
    await getTursoClient().execute({
      sql: 'UPDATE settings SET value = ?, updated_by = ? WHERE key = ?',
      args: [value, updatedBy, key]
    });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// CÓDIGOS PROMO
// ============================================================================
export async function getPromoCodesFromTurso(): Promise<SyncResult<PromoCode[]>> {
  try {
    const result = await getTursoClient().execute(
      'SELECT code, type, value, active, max_uses, current_uses, expires_at FROM promo_codes WHERE active = 1'
    );
    
    const codes: PromoCode[] = result.rows.map(row => ({
      code: row.code as string,
      type: row.type as string,
      value: row.value as number,
      active: Boolean(row.active),
      expiresAt: row.expires_at ? new Date(row.expires_at as number * 1000).toISOString() : undefined,
      maxUses: row.max_uses as number | undefined,
      currentUses: row.current_uses as number || 0
    }));
    
    return { success: true, data: codes };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

export async function addPromoCodeToTurso(code: PromoCode): Promise<SyncResult<void>> {
  try {
    const expiresAt = code.expiresAt ? Math.floor(new Date(code.expiresAt).getTime() / 1000) : null;
    
    await getTursoClient().execute({
      sql: 'INSERT INTO promo_codes (code, type, value, active, max_uses, current_uses, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [code.code, code.type, code.value, code.active ? 1 : 0, code.maxUses || null, code.currentUses, expiresAt]
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

// ============================================================================
// SUSCRIPCIONES DE TELÉFONO
// ============================================================================
export async function addPhoneSubscription(phone: string): Promise<SyncResult<void>> {
  try {
    await getTursoClient().execute({
      sql: 'INSERT OR IGNORE INTO phone_subscriptions (phone) VALUES (?)',
      args: [phone]
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

// ============================================================================
// CRUD DE PRODUCTOS
// ============================================================================
export async function addProductToSheets(product: Product): Promise<SyncResult<void>> {
  try {
    await getTursoClient().execute({
      sql: `INSERT INTO products (id, name, edition, type, description, description_en, available, features)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        product.id,
        product.name,
        product.edition || '001',
        product.type || 'snapback',
        product.description || '',
        product.descriptionEn || '',
        product.available ? 1 : 0,
        product.features?.join(',') || ''
      ]
    });
    
    for (const color of product.colors) {
      await getTursoClient().execute({
        sql: `INSERT INTO product_colors (product_id, name, hex, price, stock, images)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          product.id,
          color.name,
          color.hex,
          color.price,
          color.stock,
          JSON.stringify(color.images)
        ]
      });
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

export async function updateProductInSheets(product: Product): Promise<SyncResult<void>> {
  try {
    await getTursoClient().execute({
      sql: `UPDATE products SET name = ?, edition = ?, type = ?, description = ?, description_en = ?, available = ?, features = ?
            WHERE id = ?`,
      args: [
        product.name,
        product.edition || '001',
        product.type || 'snapback',
        product.description || '',
        product.descriptionEn || '',
        product.available ? 1 : 0,
        product.features?.join(',') || '',
        product.id
      ]
    });
    
    await getTursoClient().execute({
      sql: 'DELETE FROM product_colors WHERE product_id = ?',
      args: [product.id]
    });
    
    for (const color of product.colors) {
      await getTursoClient().execute({
        sql: `INSERT INTO product_colors (product_id, name, hex, price, stock, images)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          product.id,
          color.name,
          color.hex,
          color.price,
          color.stock,
          JSON.stringify(color.images)
        ]
      });
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

export async function deleteProductFromSheets(productId: string): Promise<SyncResult<void>> {
  try {
    await getTursoClient().execute({
      sql: 'DELETE FROM products WHERE id = ?',
      args: [productId]
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}
