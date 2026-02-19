import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSettingsFromTurso, updateSettingInTurso } from '@/lib/turso-products-v2';
import { verifyAdminToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const settings = await getSettingsFromTurso();
    const mode = settings?.store_mode || process.env.STORE_MODE || 'password';

    return NextResponse.json({
      mode,
      config: {
        mode,
        passwordUntil: settings?.password_until || null,
        backgroundImage: settings?.background_image || null,
        backgroundType: settings?.background_type || 'image',
        staticBackgroundImage: settings?.static_background_image || null,
        accentColor: settings?.accent_color || '#D4AF37',
        catalogSlogan: settings?.catalog_slogan || ''
      }
    });
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

    const { mode, passwordUntil, backgroundImage, backgroundType, staticBackgroundImage, accentColor, catalogSlogan } = await request.json();

    await updateSettingInTurso('store_mode', mode, 'admin');
    if (passwordUntil !== undefined) await updateSettingInTurso('password_until', passwordUntil ? new Date(passwordUntil).toISOString() : '', 'admin');
    if (backgroundImage !== undefined) await updateSettingInTurso('background_image', backgroundImage, 'admin');
    if (backgroundType !== undefined) await updateSettingInTurso('background_type', backgroundType, 'admin');
    if (staticBackgroundImage !== undefined) await updateSettingInTurso('static_background_image', staticBackgroundImage, 'admin');
    if (accentColor !== undefined) await updateSettingInTurso('accent_color', accentColor, 'admin');
    if (catalogSlogan !== undefined) await updateSettingInTurso('catalog_slogan', catalogSlogan, 'admin');

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error saving store config', { error });
    return NextResponse.json({ success: false, error: 'Failed to save config' }, { status: 500 });
  }
}
