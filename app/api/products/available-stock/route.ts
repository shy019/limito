import { NextRequest, NextResponse } from 'next/server';
import { getAvailableStockFromSheets } from '@/lib/sheets-reservations';
import { getProductsFromSheets } from '@/lib/sheets-products';
import { API_ERRORS } from '@/lib/api-errors';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = rateLimit(`stock-${ip}`, 120, 60000);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests', errorCode: 'RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const sessionId = request.cookies.get('limito_session_id')?.value || '';

    if (!productId) {
      return NextResponse.json({ errorCode: API_ERRORS.INVALID_REQUEST }, { status: 400 });
    }

    const result = await getProductsFromSheets();
    
    if (!result.success || !result.data) {
      return NextResponse.json({ errorCode: API_ERRORS.SERVER_ERROR }, { status: 500 });
    }

    const product = result.data.find(p => p.id === productId && p.available);

    if (!product) {
      return NextResponse.json({ errorCode: API_ERRORS.PRODUCT_NOT_FOUND }, { status: 404 });
    }

    const availableStock = await Promise.all(
      product.colors.map(async (color) => {
        const available = await getAvailableStockFromSheets(productId, color.name, color.stock || 0);
        return {
          name: color.name,
          totalStock: color.stock || 0,
          availableStock: available,
        };
      })
    );

    return NextResponse.json({ availableStock });
  } catch {
    return NextResponse.json({ errorCode: API_ERRORS.SERVER_ERROR }, { status: 500 });
  }
}
