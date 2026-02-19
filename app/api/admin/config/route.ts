import { NextResponse, NextRequest } from 'next/server';
import { getSettingsFromTurso, updateSettingInTurso, getPromoCodesFromTurso, addPromoCodeToTurso } from '@/lib/turso-products-v2';
import { hashPassword } from '@/lib/password';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { verifyAdminToken } from '@/lib/auth';
import type { PromoCode } from '@/types/admin';

async function checkAdmin(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;
  return token && await verifyAdminToken(token);
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const rateLimitResult = rateLimit(`admin-config-get:${ip}`, 20, 60000);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  if (!await checkAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'get_promo_codes') {
      const result = await getPromoCodesFromTurso();
      return NextResponse.json({ codes: result });
    }

    const config = await getSettingsFromTurso();
    
    return NextResponse.json({
      admin_password: config?.admin_password || '',
      promo_password: config?.promo_password || '',
    });
  } catch (error) {
    logger.error('Failed to load config', { error });
    return NextResponse.json({ error: 'Failed to load config' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const rateLimitResult = rateLimit(`admin-config-post:${ip}`, 10, 60000);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  if (!await checkAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { admin_password, promo_password, action, code, type, value, expiresAt } = body;
    
    if (admin_password) {
      const hashed = await hashPassword(admin_password);
      await updateSettingInTurso('admin_password', hashed, 'admin');
      logger.info('Admin password updated');
    }
    
    if (promo_password) {
      const hashed = await hashPassword(promo_password);
      await updateSettingInTurso('promo_password', hashed, 'admin');
      logger.info('Promo password updated');
    }

    if (action === 'add_access_code' || action === 'add_promo_code') {
      const newCode: PromoCode = {
        code: code || '',
        type: action === 'add_access_code' ? 'access' : type,
        value: action === 'add_access_code' ? 0 : value,
        active: true,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        maxUses: undefined,
        currentUses: 0,
      };

      const result = await addPromoCodeToTurso(newCode);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      logger.info(`Code ${code} added to Turso`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to save config', { error });
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
