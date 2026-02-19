import { NextRequest, NextResponse } from 'next/server';
import { clearCache } from '@/lib/cache';
import { verifyAdminToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  clearCache('reservations');
  clearCache('products');
  return NextResponse.json({ success: true });
}
