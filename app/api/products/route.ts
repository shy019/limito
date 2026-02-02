import { NextResponse } from 'next/server';
import { getProductsFromSheets } from '@/lib/sheets-products';
import { rateLimit } from '@/lib/rate-limit';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const rateLimitResult = rateLimit(`products-${ip}`, 30, 60000);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  try {
    const result = await getProductsFromSheets(false);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    const products = result.data?.filter(p => p.available) || [];
    
    const metadata = {
      totalProducts: products.length,
      totalStock: products.reduce((sum, p) => 
        sum + p.colors.reduce((s: number, c) => s + (c.stock || 0), 0), 0),
      lastUpdated: new Date().toISOString(),
    };
    
    return NextResponse.json({ products, metadata });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }
}
