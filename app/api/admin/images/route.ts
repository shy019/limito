import { NextRequest, NextResponse } from 'next/server';
import { processImage, deleteProductImages, deleteColorImages } from '@/lib/image-processor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, productId, colorName, index, base64Image } = body;

    if (action === 'upload') {
      if (!productId || !colorName || index === undefined || !base64Image) {
        return NextResponse.json(
          { error: 'Faltan parámetros requeridos' },
          { status: 400 }
        );
      }

      const imagePath = await processImage(base64Image, productId, colorName, index);
      return NextResponse.json({ success: true, path: imagePath });
    }

    if (action === 'delete_product') {
      if (!productId) {
        return NextResponse.json(
          { error: 'productId requerido' },
          { status: 400 }
        );
      }

      await deleteProductImages(productId);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_color') {
      if (!productId || !colorName) {
        return NextResponse.json(
          { error: 'productId y colorName requeridos' },
          { status: 400 }
        );
      }

      await deleteColorImages(productId, colorName);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Error al procesar imagen' },
      { status: 500 }
    );
  }
}
