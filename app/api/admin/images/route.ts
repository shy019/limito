import { NextRequest, NextResponse } from 'next/server';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { verifyAdminToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await verifyAdminToken(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, productId, index, base64Image, publicId } = body;

    if (action === 'upload') {
      if (!productId || index === undefined || !base64Image) {
        return NextResponse.json({ error: 'Missing required params' }, { status: 400 });
      }

      const folder = 'limito/products';
      const imgPublicId = `${productId}-${index}`;
      const url = await uploadImage(base64Image, folder, imgPublicId);
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
