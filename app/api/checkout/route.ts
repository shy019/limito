import type { NextRequest } from "next/server";
import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

import { getShippingZones } from '@/lib/shipping';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`api-${ip}`, 30, 60000).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const zones = getShippingZones();
    return NextResponse.json({ zones });
  } catch (error) {
    logger.error('Error loading shipping zones', { error });
    return NextResponse.json({ error: 'Failed to load shipping zones' }, { status: 500 });
  }
}
