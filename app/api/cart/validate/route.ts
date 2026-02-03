import { NextResponse } from 'next/server';
import { getActiveReservations } from '@/lib/sheets-reservations';

export async function POST(request: Request) {
  try {
    const { sessionId, items } = await request.json();
    if (!sessionId || !items) {
      return NextResponse.json({ validItems: [] });
    }

    const reservations = await getActiveReservations(sessionId);
    const reservedKeys = new Set(reservations.map(r => `${r.productId}-${r.color}`));
    
    const validItems = items.filter((i: {productId: string, color: string}) => 
      reservedKeys.has(`${i.productId}-${i.color}`)
    );

    return NextResponse.json({ validItems });
  } catch {
    return NextResponse.json({ validItems: [] });
  }
}
