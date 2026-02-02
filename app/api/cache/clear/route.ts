import { NextResponse } from 'next/server';
import { clearCache } from '@/lib/cache';

export async function POST() {
  clearCache('reservations');
  clearCache('products');
  return NextResponse.json({ success: true });
}
