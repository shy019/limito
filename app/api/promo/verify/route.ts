import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    
    const isValid = verifyAccessToken(token);
    
    if (!isValid) {
      logger.warn('Invalid or expired token verification attempt');
    }
    
    return NextResponse.json({ valid: isValid });
  } catch (error) {
    logger.warn('Token verification error', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json({ valid: false });
  }
}
