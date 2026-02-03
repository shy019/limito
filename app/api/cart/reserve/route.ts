import { NextRequest, NextResponse } from 'next/server';
import { reserveStockInTurso } from '@/lib/turso-products-v2';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`reserve-${ip}`, 20, 60000).success) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const { productId, color, quantity, sessionId } = await req.json();

    if (!productId || !color || !quantity || !sessionId) {
      return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 });
    }

    const result = await reserveStockInTurso(productId, color, quantity, sessionId);
    
    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error,
        available: result.data?.available || 0
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      available: result.data?.available || 0
    });
  } catch (error) {
    console.error('Error en reserve:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
