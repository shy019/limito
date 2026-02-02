import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { logger } from '@/lib/logger';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    
    jwt.verify(token, JWT_SECRET);
    
    return NextResponse.json({ valid: true });
  } catch (error) {
    logger.warn('Invalid token verification attempt', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json({ valid: false });
  }
}
