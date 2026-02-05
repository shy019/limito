import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createAccessToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('limito_access')?.value;

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json({ valid: false }, { status: 500 });
    }

    try {
      await jwtVerify(token, new TextEncoder().encode(secret));
      
      // Renovar token por otros 60 minutos
      const newToken = await createAccessToken();
      const response = NextResponse.json({ valid: true });
      response.cookies.set('limito_access', newToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60, // 60 minutos
        path: '/'
      });
      return response;
    } catch {
      return NextResponse.json({ valid: false }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 });
  }
}
