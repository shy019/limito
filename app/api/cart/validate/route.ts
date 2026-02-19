import { NextRequest, NextResponse } from 'next/server';
import { getProductsFromTurso } from '@/lib/turso-products-v2';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(`cart-validate-${ip}`, 30, 60000).success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 });
    }

    const result = await getProductsFromTurso();
    
    if (!result.success || !result.data) {
      return NextResponse.json({ error: 'Failed to get products' }, { status: 500 });
    }

    // Validar que cada item existe y tiene stock
    const validItems = items.filter(item => {
      const product = result.data!.find(p => p.id === item.productId);
      if (!product || !product.available) return false;
      if (product.stock <= 0) return false;
      return true;
    });

    return NextResponse.json({ validItems });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to validate cart' }, { status: 500 });
  }
}
