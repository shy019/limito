import { NextResponse } from 'next/server';
import { getProductsFromTurso } from '@/lib/turso-products-v2';
import { rateLimit } from '@/lib/rate-limit';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(`products-${ip}`, 30, 60000).success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const result = await getProductsFromTurso();
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    const products = result.data?.filter(p => p.available) || [];
    
    const metadata = {
      totalProducts: products.length,
      totalStock: products.reduce((sum, p) => sum + (p.stock || 0), 0),
      lastUpdated: new Date().toISOString(),
    };
    
    const response = NextResponse.json({ products, metadata });
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return response;
  } catch {
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }
}
