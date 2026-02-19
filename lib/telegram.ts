// Servicio de notificaciones de Telegram
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

interface OrderNotification {
  orderId: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  shippingAddress: {
    address: string;
    city: string;
    department: string;
  };
}

interface StockOutNotification {
  productName: string;
}

export async function sendTelegramNotification(message: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });

    return response.ok;
  } catch (error) {
    // silently ignore telegram errors
    return false;
  }
}

export async function notifyNewOrder(order: OrderNotification): Promise<boolean> {
  const itemsList = order.items
    .map(item => `  • ${item.name} x${item.quantity} - $${item.price.toLocaleString('es-CO')}`)
    .join('\n');

  const message = `
🛍️ <b>NUEVA ORDEN - ${order.orderId}</b>

👤 <b>Cliente:</b> ${order.customerName}
📱 <b>Teléfono:</b> ${order.customerPhone}

📦 <b>Productos:</b>
${itemsList}

💰 <b>Total:</b> $${order.total.toLocaleString('es-CO')} COP

📍 <b>Envío:</b>
${order.shippingAddress.address}
${order.shippingAddress.city}, ${order.shippingAddress.department}

⏰ ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
  `.trim();

  return sendTelegramNotification(message);
}

export async function notifyStockOut(notification: StockOutNotification): Promise<boolean> {
  const message = `
⚠️ <b>PRODUCTO AGOTADO</b>

📦 <b>Producto:</b> ${notification.productName}

⏰ ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
  `.trim();

  return sendTelegramNotification(message);
}

export async function notifyLowStock(productName: string, stock: number): Promise<boolean> {
  const message = `
⚠️ <b>STOCK BAJO</b>

📦 <b>Producto:</b> ${productName}
📊 <b>Stock:</b> ${stock} unidades

⏰ ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
  `.trim();

  return sendTelegramNotification(message);
}
