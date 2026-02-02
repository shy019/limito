import { NextRequest, NextResponse } from 'next/server';
import { validateSignature, parsePayUResponse, getTransactionStatus } from '@/lib/payu';
import { updateOrderInSheets } from '@/lib/sheets-orders';
import { logger } from '@/lib/logger';

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
    
    const updateResult = await updateOrderInSheets(response.referenceCode, {
      status: status === 'approved' ? 'paid' : status,
    });

    if (!updateResult.success) {
      logger.error('Failed to update order', { orderId: response.referenceCode });
    }

    logger.info('PayU webhook processed', { orderId: response.referenceCode, status });

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('PayU webhook error', { error });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
