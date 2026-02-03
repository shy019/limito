import { NextRequest, NextResponse } from 'next/server';
import { createAccessToken } from '@/lib/auth';
import { getPromoCodesFromTurso } from '@/lib/turso-products-v2';
import { rateLimit } from '@/lib/rate-limit';
import { decryptFromTransit } from '@/lib/server-crypto';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = rateLimit(`promo-${ip}`, 10, 60000);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { access: false, error: 'Demasiados intentos' },
        { status: 429 }
      );
    }

    const { code } = await req.json();
    
    // Decrypt the code
    const password = decryptFromTransit(code);

    const result = await getPromoCodesFromTurso();
    
    if (!result.success || !result.data || result.data.length === 0) {
      return NextResponse.json({ access: false });
    }

    const promo = result.data.find((p) => p.code === password.toUpperCase());

    if (!promo) {
      return NextResponse.json({ access: false });
    }

    if (!promo.active) {
      return NextResponse.json({ access: false });
    }

    if (promo.maxUses && promo.currentUses && promo.currentUses >= promo.maxUses) {
      return NextResponse.json({ access: false });
    }

    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return NextResponse.json({ access: false });
    }

    // Token expires in 5 minutes
    const token = createAccessToken();
    
    const response = NextResponse.json({ access: true, token });
    response.cookies.set('limito_access', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60, // 5 minutes
      path: '/'
    });
    
    return response;
  } catch {
    return NextResponse.json({ access: false }, { status: 500 });
  }
}
