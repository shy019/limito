import { NextResponse } from 'next/server';
import { readSheet } from '@/lib/google-sheets';

export async function GET() {
  try {
    await readSheet('products', 'A1:A1', false);
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        googleSheets: 'ok',
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}
