import { NextResponse } from 'next/server';
import { getConfigFromSheets, saveConfigToSheets } from '@/lib/sheets-config';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const sheetsConfig = await getConfigFromSheets();
    const mode = sheetsConfig?.store_mode || process.env.STORE_MODE || 'password';
    
    const response = NextResponse.json({ 
      mode, 
      config: { 
        mode, 
        passwordUntil: sheetsConfig?.password_until || null,
        backgroundImage: sheetsConfig?.background_image || null
      } 
    });
    
    response.cookies.set('store_mode', mode, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5,
      path: '/'
    });
    
    return response;
  } catch (error) {
    logger.error('Error getting store config', { error });
    const fallbackMode = process.env.STORE_MODE || 'password';
    return NextResponse.json({ mode: fallbackMode, config: { mode: fallbackMode, passwordUntil: null } });
  }
}

export async function POST(request: Request) {
  try {
    const { mode, passwordUntil, backgroundImage } = await request.json();
    
    await saveConfigToSheets('store_mode', mode);
    if (passwordUntil !== undefined) {
      await saveConfigToSheets('password_until', passwordUntil ? new Date(passwordUntil).toISOString() : '');
    }
    if (backgroundImage !== undefined) {
      await saveConfigToSheets('background_image', backgroundImage);
    }
    
    const response = NextResponse.json({ success: true });
    response.cookies.set('store_mode', mode, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5,
      path: '/'
    });
    
    return response;
  } catch (error) {
    logger.error('Error saving store config', { error });
    return NextResponse.json({ success: false, error: 'Failed to save config' }, { status: 500 });
  }
}
