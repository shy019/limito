import { NextRequest, NextResponse } from 'next/server';
import { validateSignature, parsePayUResponse, getTransactionStatus } from '@/lib/payu';
import { updateOrderInTurso, getOrdersFromTurso } from '@/lib/turso-orders';
import { logger } from '@/lib/logger';
import { confirmSaleInTurso, getSettingsFromTurso, getOrderByIdFromTurso, getProductStockFromTurso } from '@/lib/turso-products-v2';
import { notifyNewOrder, notifyStockOut } from '@/lib/telegram';

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

    await updateOrderInTurso(response.referenceCode, {
      status: status === 'approved' ? 'paid' : status,
      payu_reference: response.transactionId || '',
    });

    if (status === 'approved') {
      const order = await getOrderByIdFromTurso(response.referenceCode);

      if (order) {
        const items = JSON.parse(order.items as string);
        const sessionId = order.session_id as string;

        for (const item of items) {
          const result = await confirmSaleInTurso(
            item.productId,
            item.quantity,
            response.referenceCode,
            sessionId
          );

          if (!result.success) {
            logger.error('Failed to confirm sale', { orderId: response.referenceCode, item });
          }

          const stock = await getProductStockFromTurso(item.productId);

          if (stock === 0) {
            const settings = await getSettingsFromTurso();
            if (settings.telegram_notify_on_stock_out === 'true') {
              await notifyStockOut({ productName: item.name });
            }
          }
        }

        const settings = await getSettingsFromTurso();
        if (settings.telegram_notify_on_sale === 'true') {
          const shippingAddress = JSON.parse(order.shipping_address as string || '{}');
          await notifyNewOrder({
            orderId: response.referenceCode,
            customerName: order.customer_name as string,
            customerPhone: order.customer_phone as string,
            items: items.map((item: any) => ({
              name: item.name,
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

    logger.info('PayU webhook processed', { orderId: response.referenceCode, status });
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('PayU webhook error', { error });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
