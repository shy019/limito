import { NextRequest, NextResponse } from 'next/server';
import { getAvailableStockFromTurso } from '@/lib/turso-products-v2';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(`stock-${ip}`, 60, 60000).success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const productId = req.nextUrl.searchParams.get('productId');
  if (!productId) {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
  }

  try {
    const availableStock = await getAvailableStockFromTurso(productId);
    const response = NextResponse.json({ availableStock });
    response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
    return response;
  } catch {
    return NextResponse.json({ error: 'Failed to get stock' }, { status: 500 });
  }
}
