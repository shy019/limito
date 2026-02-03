// Turso Products - Reemplazo rápido de sheets-products
import tursoClient from './turso';

interface ProductColor {
  name: string;
  hex: string;
  images: string[];
  stock?: number;
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

export async function getProductsFromTurso(): Promise<SyncResult<Product[]>> {
  try {
    const result = await tursoClient.execute(`
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

export async function reserveStockInTurso(
  productId: string,
  color: string,
  quantity: number,
  sessionId: string,
  durationMs = 900000
): Promise<boolean> {
  try {
    const expiresAt = Date.now() + durationMs;
    
    await tursoClient.execute({
      sql: `INSERT OR REPLACE INTO reservations (product_id, color, quantity, expires_at, session_id) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [productId, color, quantity, expiresAt, sessionId]
    });
    
    return true;
  } catch {
    return false;
  }
}

export async function getAvailableStockFromTurso(
  productId: string,
  color: string,
  excludeSessionId?: string
): Promise<number> {
  try {
    // Limpiar expiradas
    await tursoClient.execute({
      sql: 'DELETE FROM reservations WHERE expires_at < ?',
      args: [Date.now()]
    });

    // Obtener stock total
    const stockResult = await tursoClient.execute({
      sql: 'SELECT stock FROM product_colors WHERE product_id = ? AND name = ?',
      args: [productId, color]
    });

    if (stockResult.rows.length === 0) return 0;
    const totalStock = Number(stockResult.rows[0].stock);

    // Obtener reservas activas
    const reservedResult = await tursoClient.execute({
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
