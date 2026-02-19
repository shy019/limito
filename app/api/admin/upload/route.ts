import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';
import { updateSettingInTurso } from '@/lib/turso-products-v2';
import { verifyAdminToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await verifyAdminToken(token))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'image';
    const field = formData.get('field') as string || 'main'; // 'main' o 'static'
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    const url = await uploadImage(base64, 'limito/backgrounds');
    
    if (field === 'static') {
      await updateSettingInTurso('static_background_image', url, 'admin');
    } else {
      await updateSettingInTurso('background_image', url, 'admin');
      await updateSettingInTurso('background_type', type, 'admin');
      
      // Si es video, generar URL de Cloudinary para el primer frame
      if (type === 'video') {
        // Cloudinary puede extraer frames de videos con transformaciones
        // Convertir URL del video a URL de imagen (primer frame)
        const frameUrl = url.replace('/video/upload/', '/video/upload/so_0,eo_0.1/').replace(/\.(mp4|webm)$/, '.jpg');
        await updateSettingInTurso('static_background_image', frameUrl, 'admin');
      }
    }

    return NextResponse.json({ success: true, path: url });
  } catch (error) {
    logger.error('Upload error', { error });
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
