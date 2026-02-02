import { readSheet, appendToSheet, updateSheet } from './google-sheets';
import { clearCache } from './cache';

interface SyncResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface Order {
  id: string;
  sessionId: string;
  customerEmail: string;
  customerName: string;
  items: any[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  status: string;
  createdAt: string;
  shippingAddress: any;
  paymentMethod?: string;
}

export async function getOrdersFromSheets(): Promise<SyncResult<Order[]>> {
  try {
    const rows = await readSheet('orders', 'A2:M100');
    
    const orders = rows.map((row: any[]) => ({
      id: row[0] || '',
      sessionId: row[1] || '',
      customerEmail: row[2] || '',
      customerName: row[3] || '',
      items: row[4] ? JSON.parse(row[4]) : [],
      subtotal: parseFloat(row[5]) || 0,
      shippingCost: parseFloat(row[6]) || 0,
      discount: parseFloat(row[7]) || 0,
      total: parseFloat(row[8]) || 0,
      status: row[9] || 'pending',
      createdAt: row[10] || new Date().toISOString(),
      shippingAddress: row[11] ? JSON.parse(row[11]) : null,
      paymentMethod: row[12] || 'payu',
    }));
    
    return { success: true, data: orders };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to read orders' };
  }
}

export async function addOrderToSheets(order: Order): Promise<SyncResult<boolean>> {
  try {
    const values = [[
      order.id,
      order.sessionId,
      order.customerEmail,
      order.customerName,
      JSON.stringify(order.items),
      order.subtotal,
      order.shippingCost,
      order.discount,
      order.total,
      order.status,
      order.createdAt,
      JSON.stringify(order.shippingAddress),
      order.paymentMethod || 'payu',
    ]];
    
    await appendToSheet('orders', values);
    await getOrdersFromSheets();
    return { success: true, data: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add order' };
  }
}

export async function updateOrderInSheets(orderId: string, updates: Partial<Order>): Promise<SyncResult<boolean>> {
  try {
    const rows = await readSheet('orders', 'A2:M100');
    let rowIndex = -1;
    
    rows.forEach((row, index) => {
      if (row[0] === orderId) {
        rowIndex = index + 2;
      }
    });
    
    if (rowIndex > 0) {
      const existingOrder = {
        id: String(rows[rowIndex - 2][0]),
        sessionId: String(rows[rowIndex - 2][1]),
        customerEmail: String(rows[rowIndex - 2][2]),
        customerName: String(rows[rowIndex - 2][3]),
        items: JSON.parse(String(rows[rowIndex - 2][4] || '[]')),
        subtotal: parseFloat(String(rows[rowIndex - 2][5])) || 0,
        shippingCost: parseFloat(String(rows[rowIndex - 2][6])) || 0,
        discount: parseFloat(String(rows[rowIndex - 2][7])) || 0,
        total: parseFloat(String(rows[rowIndex - 2][8])) || 0,
        status: String(rows[rowIndex - 2][9]),
        createdAt: String(rows[rowIndex - 2][10]),
        shippingAddress: JSON.parse(String(rows[rowIndex - 2][11] || 'null')),
        paymentMethod: String(rows[rowIndex - 2][12] || 'payu'),
      };
      
      const updatedOrder = { ...existingOrder, ...updates };
      
      const values = [[
        updatedOrder.id,
        updatedOrder.sessionId,
        updatedOrder.customerEmail,
        updatedOrder.customerName,
        JSON.stringify(updatedOrder.items),
        updatedOrder.subtotal,
        updatedOrder.shippingCost,
        updatedOrder.discount,
        updatedOrder.total,
        updatedOrder.status,
        updatedOrder.createdAt,
        JSON.stringify(updatedOrder.shippingAddress),
        updatedOrder.paymentMethod,
      ]];
      
      await updateSheet('orders', `A${rowIndex}:M${rowIndex}`, values);
      await getOrdersFromSheets();
      return { success: true, data: true };
    }
    
    return { success: false, error: 'Order not found' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update order' };
  }
}
