import { NextResponse } from 'next/server';
import { getOrdersFromSheets } from '@/lib/sheets-orders';

export async function GET() {
  try {
    const result = await getOrdersFromSheets();
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json({ orders: result.data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
