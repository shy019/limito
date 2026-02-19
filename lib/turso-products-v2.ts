// Turso Products V2 - Base de datos SQLite con Turso
import { createClient } from '@libsql/client';


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

interface Product {
  id: string;
  name: string;
  edition: string;
  type: string;
  description: string;
  descriptionEn: string;
  available: boolean;
  price: number;
  stock: number;
  images: string[];
  features: string[];
  featuresEn: string[];
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
    // silently ignore cleanup errors
  }
}

// ============================================================================
// PRODUCTOS
// ============================================================================
export async function getProductsFromTurso(): Promise<SyncResult<Product[]>> {
  try {
    const result = await getTursoClient().execute(`
      SELECT id, name, edition, type, description, description_en, available, features, features_en,
             price, stock, images
      FROM products
      WHERE available = 1
      ORDER BY id
    `);

    const products: Product[] = result.rows.map(row => ({
      id: row.id as string,
      name: row.name as string,
      edition: row.edition as string || '001',
      type: row.type as string || 'snapback',
      description: row.description as string || '',
      descriptionEn: row.description_en as string || '',
      available: Boolean(row.available),
      price: Number(row.price) || 0,
      stock: Number(row.stock) || 0,
      images: row.images ? JSON.parse(row.images as string) : [],
      features: row.features ? String(row.features).split(',').map(f => f.trim()) : [],
      featuresEn: row.features_en ? String(row.features_en).split(',').map(f => f.trim()) : []
    }));

    return { success: true, data: products };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================================================
// STOCK DISPONIBLE (con limpieza automática)
// ============================================================================
export async function getAvailableStockFromTurso(
  productId: string,
  excludeSessionId?: string
): Promise<number> {
  try {
    await cleanExpiredReservations();

    const stockResult = await getTursoClient().execute({
      sql: 'SELECT stock FROM products WHERE id = ?',
      args: [productId]
    });

    if (stockResult.rows.length === 0) return 0;
    const totalStock = Number(stockResult.rows[0].stock);

    const reservedResult = await getTursoClient().execute({
      sql: `SELECT COALESCE(SUM(quantity), 0) as reserved 
            FROM reservations 
            WHERE product_id = ? AND expires_at > ? 
            ${excludeSessionId ? 'AND session_id != ?' : ''}`,
      args: excludeSessionId 
        ? [productId, Date.now(), excludeSessionId]
        : [productId, Date.now()]
    });

    const reserved = Number(reservedResult.rows[0].reserved) || 0;
    return Math.max(0, totalStock - reserved);
  } catch {
    return 0;
  }
}

// ============================================================================
// RESERVAR STOCK (atómico con transacción + retry)
// ============================================================================
export async function reserveStockInTurso(
  productId: string,
  quantity: number,
  sessionId: string
): Promise<SyncResult<{ available: number }>> {
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await cleanExpiredReservations();

      const client = getTursoClient();

      const settingsResult = await client.execute({
        sql: 'SELECT value FROM settings WHERE key = ?',
        args: ['reservation_duration_minutes']
      });
      const durationMinutes = settingsResult.rows.length > 0 
        ? Number(settingsResult.rows[0].value) 
        : 10;
      const expiresAt = Date.now() + (durationMinutes * 60 * 1000);
      const now = Date.now();

      const results = await client.batch([
        { sql: 'SELECT stock FROM products WHERE id = ?', args: [productId] },
        { 
          sql: `SELECT COALESCE(SUM(quantity), 0) as reserved 
                FROM reservations 
                WHERE product_id = ? AND expires_at > ? AND session_id != ?`,
          args: [productId, now, sessionId]
        },
        {
          sql: `INSERT INTO reservations (product_id, quantity, session_id, expires_at) 
                VALUES (?, ?, ?, ?)
                ON CONFLICT(product_id, session_id) DO UPDATE SET 
                  quantity = excluded.quantity,
                  expires_at = excluded.expires_at`,
          args: [productId, quantity, sessionId, expiresAt]
        }
      ], 'deferred');

      const totalStock = Number(results[0].rows[0]?.stock) || 0;
      const othersReserved = Number(results[1].rows[0]?.reserved) || 0;
      const available = Math.max(0, totalStock - othersReserved);

      if (quantity > available) {
        await client.execute({
          sql: 'DELETE FROM reservations WHERE product_id = ? AND session_id = ?',
          args: [productId, sessionId]
        });
        return { 
          success: false, 
          error: `Solo ${available} disponibles`,
          data: { available }
        };
      }

      return { success: true, data: { available: available - quantity } };
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('SQLITE_BUSY') && attempt < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, 150 + Math.random() * 200 * (attempt + 1)));
        continue;
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al reservar'
      };
    }
  }

  return { success: false, error: 'Error al reservar, intenta de nuevo' };
}

// ============================================================================
// LIBERAR RESERVA
// ============================================================================
export async function releaseReservationInTurso(
  productId: string,
  sessionId: string
): Promise<boolean> {
  try {
    await getTursoClient().execute({
      sql: 'DELETE FROM reservations WHERE product_id = ? AND session_id = ?',
      args: [productId, sessionId]
    });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// CONFIRMAR VENTA (atómico — reduce stock con condición)
// ============================================================================
export async function confirmSaleInTurso(
  productId: string,
  quantity: number,
  orderId: string,
  sessionId: string
): Promise<SyncResult<void>> {
  try {
    const client = getTursoClient();

    // Reducir stock atómicamente solo si hay suficiente
    const updateResult = await client.execute({
      sql: 'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
      args: [quantity, productId, quantity]
    });

    if (updateResult.rowsAffected === 0) {
      return { success: false, error: 'Stock insuficiente' };
    }

    // Leer stock resultante para auditoría
    const stockResult = await client.execute({
      sql: 'SELECT stock FROM products WHERE id = ?',
      args: [productId]
    });
    const newStock = Number(stockResult.rows[0]?.stock) || 0;

    await client.execute({
      sql: `INSERT INTO stock_audit (product_id, event_type, quantity_change, stock_before, stock_after, order_id, notes)
            VALUES (?, 'sale', ?, ?, ?, ?, 'Sale confirmed')`,
      args: [productId, -quantity, newStock + quantity, newStock, orderId]
    });

    await releaseReservationInTurso(productId, sessionId);

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
      sql: `INSERT INTO settings (key, value, updated_by) VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = unixepoch()`,
      args: [key, value, updatedBy]
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
    const client = getTursoClient();
    
    await client.execute({
      sql: 'INSERT INTO promo_codes (code, type, value, active, max_uses, current_uses, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [code.code, code.type, code.value, code.active ? 1 : 0, code.maxUses || null, code.currentUses || 0, expiresAt]
    } as any);
    
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
export async function addProductToTurso(product: Product): Promise<SyncResult<void>> {
  try {
    await getTursoClient().execute({
      sql: `INSERT INTO products (id, name, edition, type, description, description_en, price, stock, images, available, features, features_en)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        product.id,
        product.name,
        product.edition || '001',
        product.type || 'snapback',
        product.description || '',
        product.descriptionEn || '',
        product.price || 0,
        product.stock || 0,
        JSON.stringify(product.images || []),
        product.available ? 1 : 0,
        product.features?.join(',') || '',
        product.featuresEn?.join(',') || ''
      ]
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

export async function updateProductInTurso(product: Product): Promise<SyncResult<void>> {
  try {
    await getTursoClient().execute({
      sql: `UPDATE products SET name = ?, edition = ?, type = ?, description = ?, description_en = ?, 
            price = ?, stock = ?, images = ?, available = ?, features = ?, features_en = ?
            WHERE id = ?`,
      args: [
        product.name,
        product.edition || '001',
        product.type || 'snapback',
        product.description || '',
        product.descriptionEn || '',
        product.price || 0,
        product.stock || 0,
        JSON.stringify(product.images || []),
        product.available ? 1 : 0,
        product.features?.join(',') || '',
        product.featuresEn?.join(',') || '',
        product.id
      ]
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

export async function deleteProductFromTurso(productId: string): Promise<SyncResult<void>> {
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

export async function getOrderByIdFromTurso(orderId: string) {
  const result = await getTursoClient().execute({
    sql: 'SELECT items, session_id, customer_name, customer_phone, shipping_address, total FROM orders WHERE id = ?',
    args: [orderId]
  });
  return result.rows[0] || null;
}

export async function getProductStockFromTurso(productId: string): Promise<number> {
  const result = await getTursoClient().execute({
    sql: 'SELECT stock FROM products WHERE id = ?',
    args: [productId]
  });
  return result.rows.length > 0 ? Number(result.rows[0].stock) : -1;
}
