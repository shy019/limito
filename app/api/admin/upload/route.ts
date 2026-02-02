import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';
import { saveConfigToSheets } from '@/lib/sheets-config';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    const url = await uploadImage(base64, 'limito/backgrounds');
    await saveConfigToSheets('background_image', url);

    return NextResponse.json({ success: true, path: url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
