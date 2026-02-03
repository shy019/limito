import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

import { getSettingsFromTurso, updateSettingInTurso } from '@/lib/turso-products-v2';
import { verifyAdminToken } from '@/lib/auth';

const USE_TURSO = process.env.USE_TURSO === 'true';

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`api-${ip}`, 30, 60000).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const token = req.cookies.get('admin_token')?.value;
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!USE_TURSO) {
      return NextResponse.json({ 
        success: false, 
        error: 'Turso not enabled' 
      }, { status: 400 });
    }

    const settings = await getSettingsFromTurso();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error loading settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`api-${ip}`, 20, 60000).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const token = req.cookies.get('admin_token')?.value;
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!USE_TURSO) {
      return NextResponse.json({ 
        success: false, 
        error: 'Turso not enabled' 
      }, { status: 400 });
    }

    const { key, value } = await req.json();

    if (!key || value === undefined) {
      return NextResponse.json({ success: false, error: 'Missing key or value' }, { status: 400 });
    }

    const success = await updateSettingInTurso(key, value, 'admin');
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Failed to update setting' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json({ success: false, error: 'Failed to update setting' }, { status: 500 });
  }
}
