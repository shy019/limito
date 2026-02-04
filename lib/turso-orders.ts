// Turso Orders - Gestión de órdenes
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

interface Order {
  id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  items: any[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: string;
  payu_reference?: string;
  shipping_address?: string;
  shipping_city?: string;
}

export async function getOrdersFromTurso() {
  try {
    const result = await getTursoClient().execute(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );
    
    const orders = result.rows.map(row => ({
      id: row.id,
      customer_name: row.customer_name,
      customer_email: row.customer_email,
      customer_phone: row.customer_phone,
      items: JSON.parse(row.items as string),
      subtotal: row.subtotal,
      shipping: row.shipping,
      discount: row.discount || 0,
      total: row.total,
      status: row.status,
      payu_reference: row.payu_reference,
      shipping_address: row.shipping_address,
      shipping_city: row.shipping_city,
      created_at: row.created_at
    }));
    
    return { success: true, orders };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

export async function addOrderToTurso(order: Order) {
  try {
    await getTursoClient().execute({
      sql: `INSERT INTO orders (id, customer_name, customer_email, customer_phone, items, subtotal, shipping, discount, total, status, payu_reference, shipping_address, shipping_city)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        order.id,
        order.customer_name || null,
        order.customer_email || null,
        order.customer_phone || null,
        JSON.stringify(order.items),
        order.subtotal,
        order.shipping,
        order.discount || 0,
        order.total,
        order.status,
        order.payu_reference || null,
        order.shipping_address || null,
        order.shipping_city || null
      ]
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

export async function updateOrderInTurso(orderId: string, updates: Partial<Order>) {
  try {
    const setClauses: string[] = [];
    const args: any[] = [];
    
    if (updates.status) {
      setClauses.push('status = ?');
      args.push(updates.status);
    }
    
    if (updates.payu_reference) {
      setClauses.push('payu_reference = ?');
      args.push(updates.payu_reference);
    }
    
    if (setClauses.length === 0) {
      return { success: true };
    }
    
    args.push(orderId);
    
    await getTursoClient().execute({
      sql: `UPDATE orders SET ${setClauses.join(', ')}, updated_at = unixepoch() WHERE id = ?`,
      args
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}
