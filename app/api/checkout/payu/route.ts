import { NextRequest, NextResponse } from 'next/server';
import { generateSignature } from '@/lib/payu';
import { addOrderToSheets } from '@/lib/sheets-orders';
import { logger } from '@/lib/logger';
import { decryptFromTransit } from '@/lib/server-crypto';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`checkout-${ip}`, 5, 60000).success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { sessionId, customerEmail: encEmail, customerName: encName, customerPhone: encPhone, items, subtotal, shippingCost, discount, total, shippingAddress } = body;

    if (!sessionId || !encEmail || !encName || !encPhone || !items || !total) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Decrypt customer data
    const customerEmail = decryptFromTransit(encEmail);
    const customerName = decryptFromTransit(encName);
    const customerPhone = decryptFromTransit(encPhone);

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
