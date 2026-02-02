import { NextRequest, NextResponse } from 'next/server';
import { generateSignature } from '@/lib/payu';
import { addOrderToSheets } from '@/lib/sheets-orders';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, customerEmail, customerName, customerPhone, items, subtotal, shippingCost, discount, total, shippingAddress } = body;

    if (!sessionId || !customerEmail || !customerName || !customerPhone || !items || !total) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const orderId = `LIMITO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tax = Math.round(total * 0.19);
    const description = `Orden LIMITØ - ${items.length} producto(s)`;

    const order = {
      id: orderId,
      sessionId,
      customerEmail,
      customerName,
      items,
      subtotal,
      shippingCost,
      discount,
      total,
      status: 'pending',
      createdAt: new Date().toISOString(),
      shippingAddress,
    };

    const result = await addOrderToSheets(order);

    if (!result.success) {
      logger.error('Failed to create order', { orderId });
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    const signature = generateSignature(orderId, total);
    const responseUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/response`;
    const confirmationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/payu`;

    return NextResponse.json({ 
      success: true, 
      orderId,
      payuData: {
        merchantId: process.env.PAYU_MERCHANT_ID,
        accountId: process.env.PAYU_ACCOUNT_ID,
        description,
        referenceCode: orderId,
        amount: total,
        tax,
        taxReturnBase: (total - tax).toFixed(2),
        currency: 'COP',
        signature,
        test: process.env.PAYU_TEST_MODE === 'true' ? '1' : '0',
        buyerEmail: customerEmail,
        buyerFullName: customerName,
        responseUrl,
        confirmationUrl,
        payerFullName: customerName,
        payerEmail: customerEmail,
        telephone: customerPhone,
        shippingAddress: shippingAddress.city || 'Bogotá',
        shippingCity: shippingAddress.city || 'Bogotá',
        shippingCountry: 'CO',
      }
    });
  } catch (error) {
    logger.error('PayU checkout error', { error });
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
