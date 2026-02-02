import { NextRequest, NextResponse } from 'next/server';
import { updateOrderInSheets } from '@/lib/sheets-orders';
import { sendTrackingEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { orderId, status, trackingNumber, carrier } = await req.json();
    
    const updates: any = {};
    if (status) updates.status = status;
    if (trackingNumber) updates.trackingNumber = trackingNumber;
    if (carrier) updates.carrier = carrier;
    
    const result = await updateOrderInSheets(orderId, updates);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    
    if (trackingNumber) {
      const ordersResult = await import('@/lib/sheets-orders').then(m => m.getOrdersFromSheets());
      const order = ordersResult.data?.find(o => o.id === orderId);
      
      if (order?.customerEmail) {
        await sendTrackingEmail({
          orderId: order.id,
          customerEmail: order.customerEmail,
          trackingNumber,
          carrier: carrier || 'Coordinadora',
        });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
