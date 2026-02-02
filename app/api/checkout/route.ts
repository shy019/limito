import { NextResponse } from 'next/server';
import { getShippingZones } from '@/lib/shipping';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const zones = getShippingZones();
    return NextResponse.json({ zones });
  } catch (error) {
    logger.error('Error loading shipping zones', { error });
    return NextResponse.json({ error: 'Failed to load shipping zones' }, { status: 500 });
  }
}
