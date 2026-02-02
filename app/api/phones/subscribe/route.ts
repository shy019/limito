import { NextResponse } from 'next/server';
import { appendToSheet, readSheet } from '@/lib/google-sheets';
import { decryptFromTransit } from '@/lib/server-crypto';

export async function POST(request: Request) {
  try {
    const { phone: encryptedPhone } = await request.json();
    
    // Decrypt phone number
    const phone = decryptFromTransit(encryptedPhone);

    if (!phone || phone.length < 12) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    // Verificar si la hoja tiene encabezados
    const existingData = await readSheet('phones', 'A:B', false);
    if (!existingData || existingData.length === 0) {
      await appendToSheet('phones', [['phone', 'timestamp']]);
    }

    // Guardar en Google Sheets
    await appendToSheet('phones', [[phone, new Date().toISOString()]]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving phone:', error);
    return NextResponse.json({ error: 'Failed to save phone' }, { status: 500 });
  }
}
