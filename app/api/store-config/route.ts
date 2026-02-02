import { NextResponse } from 'next/server';
import { getCurrentMode, getStoreConfig } from '@/lib/store-config-server';
import { getConfigFromSheets, saveConfigToSheets } from '@/lib/sheets-config';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const sheetsConfig = await getConfigFromSheets();
    
    const mode = sheetsConfig?.store_mode || getCurrentMode();
    const config = sheetsConfig?.store_mode 
      ? { mode: sheetsConfig.store_mode, passwordUntil: sheetsConfig.password_until || null }
      : getStoreConfig();
    
    const response = NextResponse.json({ mode, config });
    
    // Set cookie for middleware to read without making API calls
    response.cookies.set('store_mode', mode, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5, // 5 minutes
      path: '/'
    });
    
    return response;
  } catch (error) {
    logger.error('Error getting store config', { error });
    return NextResponse.json({ mode: 'active', config: { mode: 'active', passwordUntil: null } });
  }
}

export async function POST(request: Request) {
  try {
    const { mode, passwordUntil } = await request.json();
    
    const isoPasswordUntil = passwordUntil ? new Date(passwordUntil).toISOString() : '';
    
    await saveConfigToSheets('store_mode', mode);
    await saveConfigToSheets('password_until', isoPasswordUntil);
    
    const { saveStoreConfig } = await import('@/lib/store-config-server');
    saveStoreConfig({ mode, passwordUntil: isoPasswordUntil || null });
    
    const response = NextResponse.json({ success: true });
    
    // Update cookie
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
