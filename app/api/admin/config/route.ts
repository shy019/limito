import { NextResponse, NextRequest } from 'next/server';
import { getConfigFromSheets, saveConfigToSheets } from '@/lib/sheets-config';
import { readSheet, updateSheet } from '@/lib/google-sheets';
import { getPromoCodesFromSheets } from '@/lib/sheets-promo';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import type { PromoCode } from '@/types/admin';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const rateLimitResult = rateLimit(`admin-config-get:${ip}`, 20, 60000);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'get_promo_codes') {
      const promoCodes = await getPromoCodesFromSheets();
      return NextResponse.json({ codes: promoCodes });
    }

    const config = await getConfigFromSheets();
    
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

  try {
    const body = await req.json();
    const { admin_password, promo_password, action, code, type, value, expiresAt } = body;
    
    if (admin_password) {
      const hashed = await bcrypt.hash(admin_password, 10);
      await saveConfigToSheets('admin_password', hashed);
      logger.info('Admin password updated');
    }
    
    if (promo_password) {
      const hashed = await bcrypt.hash(promo_password, 10);
      await saveConfigToSheets('promo_password', hashed);
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

      const promoRows = await readSheet('promo_codes', 'A2:G1000');
      const nextRow = promoRows.length + 2;
      await updateSheet('promo_codes', `A${nextRow}:G${nextRow}`, [[
        newCode.code || '',
        newCode.type || '',
        newCode.value || 0,
        newCode.active,
        newCode.expiresAt || '',
        newCode.maxUses || '',
        newCode.currentUses || 0
      ]]);

      await getPromoCodesFromSheets();
      logger.info(`Code ${code} added to Sheets`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to save config', { error });
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
