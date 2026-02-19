import { NextRequest, NextResponse } from 'next/server';
import { reserveStockInTurso } from '@/lib/turso-products-v2';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`reserve-${ip}`, 20, 60000).success) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const { productId, quantity, sessionId } = await req.json();

    if (!productId || !quantity || !sessionId) {
      return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 5) {
      return NextResponse.json({ success: false, error: 'Cantidad inválida' }, { status: 400 });
    }

    const result = await reserveStockInTurso(productId, qty, sessionId);
    
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
    logger.error('Error en reserve', { error });
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
