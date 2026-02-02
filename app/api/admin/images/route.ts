import { NextRequest, NextResponse } from 'next/server';
import { uploadImage, deleteImage } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, productId, colorName, index, base64Image, publicId } = body;

    if (action === 'upload') {
      if (!productId || !colorName || index === undefined || !base64Image) {
        return NextResponse.json({ error: 'Missing required params' }, { status: 400 });
      }

      const normalizedColor = colorName.toLowerCase().replace(/\s+/g, '-');
      const folder = 'limito/products';
      const publicId = `${productId}-${normalizedColor}-${index}`;
      const url = await uploadImage(base64Image, folder, publicId);
      return NextResponse.json({ success: true, path: url });
    }

    if (action === 'delete' && publicId) {
      await deleteImage(publicId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Image processing error:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
