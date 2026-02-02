import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminToken } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const rateLimitResult = rateLimit(`admin-verify:${ip}`, 5, 300000);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429 }
    );
  }

  try {
    const { password } = await req.json();

    const hash = crypto.createHash('sha256').update(password).digest('hex');

    if (hash === process.env.ADMIN_PASSWORD_HASH) {
      const token = createAdminToken();
      const response = NextResponse.json({ access: true });
      response.cookies.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      });
      return response;
    }

    return NextResponse.json({ access: false }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
