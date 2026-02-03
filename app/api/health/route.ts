import { NextResponse } from 'next/server';
import { getProductsFromTurso } from '@/lib/turso-products-v2';

export async function GET() {
  try {
    await getProductsFromTurso();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        turso: 'ok',
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
