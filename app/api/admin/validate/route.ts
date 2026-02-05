import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, createAdminToken } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const rateLimitResult = rateLimit(`admin-validate:${ip}`, 1000, 60000);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  try {
    const token = req.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    const isValid = await verifyAdminToken(token);

    if (isValid) {
      // Renovar token por otros 15 minutos
      const newToken = await createAdminToken();
      const response = NextResponse.json({ valid: true });
      response.cookies.set('admin_token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 15, // 15 minutos
        path: '/'
      });
      return response;
    }

    return NextResponse.json({ valid: false }, { status: 401 });
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 });
  }
}
