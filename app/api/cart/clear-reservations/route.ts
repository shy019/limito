import { NextResponse } from 'next/server';
import { clearAllReservationsInSheets } from '@/lib/sheets-reservations';
import { clearCache } from '@/lib/cache';

export async function POST() {
  await clearAllReservationsInSheets();
  clearCache('reservations');
  return NextResponse.json({ success: true });
}
