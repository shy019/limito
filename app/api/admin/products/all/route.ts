import { NextResponse, NextRequest } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { getProductsFromTurso } from '@/lib/turso-products-v2';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`api-${ip}`, 30, 60000).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const result = await getProductsFromTurso();
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json({ products: result.data || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }
}
