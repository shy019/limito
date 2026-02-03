import type { NextRequest } from "next/server";
import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

import { getOrdersFromTurso } from '@/lib/turso-orders';

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`api-${ip}`, 30, 60000).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const result = await getOrdersFromTurso();
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json({ orders: result.data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
