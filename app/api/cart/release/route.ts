import { NextRequest, NextResponse } from 'next/server';
import { releaseReservationInTurso } from '@/lib/turso-products-v2';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(`cart-release-${ip}`, 30, 60000).success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { productId, sessionId } = await req.json();

    if (!productId || !sessionId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await releaseReservationInTurso(productId, sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to release reservation' }, { status: 500 });
  }
}
