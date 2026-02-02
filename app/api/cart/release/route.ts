import { NextRequest, NextResponse } from 'next/server';
import { releaseStockInSheets } from '@/lib/sheets-reservations';
import { clearCache } from '@/lib/cache';

export async function POST(req: NextRequest) {
  try {
    const { productId, color, sessionId } = await req.json();

    if (!productId || !color || !sessionId) {
      return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 });
    }

    await releaseStockInSheets(productId, color, sessionId);
    clearCache('reservations');
    clearCache('products');

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Error al liberar stock' }, { status: 500 });
  }
}
