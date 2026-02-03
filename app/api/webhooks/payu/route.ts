import { NextRequest, NextResponse } from 'next/server';
import { validateSignature, parsePayUResponse, getTransactionStatus } from '@/lib/payu';
import { updateOrderInSheets } from '@/lib/turso-orders';
import { logger } from '@/lib/logger';
import tursoClient from '@/lib/turso';
import { confirmSaleInTurso, getSettingsFromTurso } from '@/lib/turso-products-v2';
import { notifyNewOrder, notifyStockOut } from '@/lib/telegram';

const USE_TURSO = process.env.USE_TURSO === 'true';

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const data = Object.fromEntries(body.entries());
    
    const response = parsePayUResponse(data);
    
    const isValid = validateSignature(
      response.signature,
      response.referenceCode,
      response.amount,
      response.state
    );

    if (!isValid) {
      logger.error('Invalid PayU signature', { response });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const status = getTransactionStatus(response.state);
    
    if (USE_TURSO) {
      // Actualizar orden en Turso
      await tursoClient.execute({
        sql: 'UPDATE orders SET status = ?, payu_reference = ? WHERE id = ?',
        args: [status === 'approved' ? 'paid' : status, response.transactionId || '', response.referenceCode]
      });

      // Si el pago fue aprobado, confirmar venta y reducir stock
      if (status === 'approved') {
        // Obtener orden
        const orderResult = await tursoClient.execute({
          sql: 'SELECT items, session_id, customer_name, customer_phone, shipping_address, total FROM orders WHERE id = ?',
          args: [response.referenceCode]
        });

        if (orderResult.rows.length > 0) {
          const order = orderResult.rows[0];
          const items = JSON.parse(order.items as string);
          const sessionId = order.session_id as string;

          // Confirmar cada item (reduce stock y audita)
          for (const item of items) {
            const result = await confirmSaleInTurso(
              item.productId,
              item.color,
              item.quantity,
              response.referenceCode,
              sessionId
            );

            if (!result.success) {
              logger.error('Failed to confirm sale', { orderId: response.referenceCode, item });
            }

            // Verificar si se agotó y notificar
            const stockResult = await tursoClient.execute({
              sql: 'SELECT stock FROM product_colors WHERE product_id = ? AND name = ?',
              args: [item.productId, item.color]
            });

            if (stockResult.rows.length > 0 && Number(stockResult.rows[0].stock) === 0) {
              const settings = await getSettingsFromTurso();
              if (settings.telegram_notify_on_stock_out === 'true') {
                await notifyStockOut({
                  productName: item.name,
                  color: item.color
                });
              }
            }
          }

          // Notificar nueva orden por Telegram
          const settings = await getSettingsFromTurso();
          if (settings.telegram_notify_on_sale === 'true') {
            const shippingAddress = JSON.parse(order.shipping_address as string || '{}');
            await notifyNewOrder({
              orderId: response.referenceCode,
              customerName: order.customer_name as string,
              customerPhone: order.customer_phone as string,
              items: items.map((item: any) => ({
                name: item.name,
                color: item.color,
                quantity: item.quantity,
                price: item.price
              })),
              total: Number(order.total),
              shippingAddress: {
                address: shippingAddress.address || '',
                city: shippingAddress.city || '',
                department: shippingAddress.department || ''
              }
            });
          }
        }
      }
    } else {
      // Fallback a Sheets
      const updateResult = await updateOrderInSheets(response.referenceCode, {
        status: status === 'approved' ? 'paid' : status,
      });

      if (!updateResult.success) {
        logger.error('Failed to update order', { orderId: response.referenceCode });
      }
    }

    logger.info('PayU webhook processed', { orderId: response.referenceCode, status });

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('PayU webhook error', { error });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
