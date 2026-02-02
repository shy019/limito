import { NextRequest, NextResponse } from 'next/server';
import { reserveStockInSheets, getAvailableStockFromSheets } from '@/lib/sheets-reservations';
import { getProductsFromSheets } from '@/lib/sheets-products';
import { clearCache } from '@/lib/cache';
import { readSheet } from '@/lib/google-sheets';

export async function POST(req: NextRequest) {
  try {
    const { productId, color, quantity, sessionId } = await req.json();

    if (!productId || !color || !quantity || !sessionId) {
      return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 });
    }

    // Ejecutar en paralelo: obtener productos y leer reservas
    const [result, rows] = await Promise.all([
      getProductsFromSheets(),
      readSheet('reservations', 'A2:E1000', false)
    ]);
    
    if (!result.success || !result.data) {
      return NextResponse.json({ success: false, error: 'Error al cargar productos' }, { status: 500 });
    }

    const product = result.data.find(p => p.id === productId);
    const colorData = product?.colors.find(c => c.name === color);

    if (!colorData) {
      return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 });
    }

    // Obtener reserva actual de esta sesión
    const currentReservation = rows.find(
      (row) => row[0] === productId && row[1] === color && row[4] === sessionId
    );
    const currentQuantity = currentReservation ? Number(currentReservation[2]) : 0;

    // Solo validar stock si está AUMENTANDO la cantidad
    if (quantity > currentQuantity) {
      const available = await getAvailableStockFromSheets(productId, color, colorData.stock || 0, sessionId);

      if (quantity - currentQuantity > available) {
        return NextResponse.json({ 
          success: false, 
          error: `Solo ${available} disponibles`,
          available
        }, { status: 400 });
      }

      if (available === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Producto agotado',
          available: 0
        }, { status: 400 });
      }
    }

    // Ejecutar en paralelo: reservar y limpiar cache
    await Promise.all([
      reserveStockInSheets(productId, color, quantity, sessionId),
      Promise.resolve().then(() => {
        clearCache('reservations');
        clearCache('products');
      })
    ]);

    const finalAvailable = await getAvailableStockFromSheets(productId, color, colorData.stock || 0);
    return NextResponse.json({ success: true, available: finalAvailable });
  } catch {
    return NextResponse.json({ success: false, error: 'Error al reservar stock' }, { status: 500 });
  }
}
