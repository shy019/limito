import { NextRequest, NextResponse } from 'next/server';
import { getProductsFromTurso } from '@/lib/turso-products-v2';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(`stock-${ip}`, 60, 60000).success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }

    const result = await getProductsFromTurso();
    
    if (!result.success || !result.data) {
      return NextResponse.json({ error: 'Failed to get products' }, { status: 500 });
    }

    const product = result.data.find(p => p.id === productId);
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const availableStock = product.colors.map(color => ({
      name: color.name,
      availableStock: color.stock || 0
    }));

    return NextResponse.json({ availableStock });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get stock' }, { status: 500 });
  }
}
