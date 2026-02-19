import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSettingsFromTurso, updateSettingInTurso } from '@/lib/turso-products-v2';
import { verifyAdminToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const settings = await getSettingsFromTurso();
    const mode = settings?.store_mode || process.env.STORE_MODE || 'password';
    
    const response = NextResponse.json({ 
      mode, 
      config: { 
        mode, 
        passwordUntil: settings?.password_until || null,
        backgroundImage: settings?.background_image || null,
        backgroundType: settings?.background_type || 'image',
        staticBackgroundImage: settings?.static_background_image || null,
        accentColor: settings?.accent_color || '#D4AF37'
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

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await verifyAdminToken(token))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { mode, passwordUntil, backgroundImage, backgroundType, staticBackgroundImage, accentColor } = await request.json();
    
    await updateSettingInTurso('store_mode', mode, 'admin');
    if (passwordUntil !== undefined) {
      await updateSettingInTurso('password_until', passwordUntil ? new Date(passwordUntil).toISOString() : '', 'admin');
    }
    if (backgroundImage !== undefined) {
      await updateSettingInTurso('background_image', backgroundImage, 'admin');
    }
    if (backgroundType !== undefined) {
      await updateSettingInTurso('background_type', backgroundType, 'admin');
    }
    if (staticBackgroundImage !== undefined) {
      await updateSettingInTurso('static_background_image', staticBackgroundImage, 'admin');
    }
    if (accentColor !== undefined) {
      await updateSettingInTurso('accent_color', accentColor, 'admin');
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
