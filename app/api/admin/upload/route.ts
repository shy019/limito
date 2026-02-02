import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop();
    const filename = `background.${ext}`;
    const filepath = path.join(process.cwd(), 'public', 'images', 'bg', filename);

    await writeFile(filepath, buffer);

    const configPath = path.join(process.cwd(), 'public', 'data', 'store-config.json');
    const configData = await readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);
    config.backgroundImage = `/images/bg/${filename}`;
    await writeFile(configPath, JSON.stringify(config, null, 2));

    return NextResponse.json({ 
      success: true, 
      path: `/images/bg/${filename}` 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
