import { NextResponse } from 'next/server';
import { addPhoneSubscription } from '@/lib/turso-products-v2';
import { decryptFromTransit } from '@/lib/server-crypto';

export async function POST(request: Request) {
  try {
    const { phone: encryptedPhone } = await request.json();
    
    // Decrypt phone number
    const phone = decryptFromTransit(encryptedPhone);

    if (!phone || phone.length < 12) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const result = await addPhoneSubscription(phone);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving phone:', error);
    return NextResponse.json({ error: 'Failed to save phone' }, { status: 500 });
  }
}
