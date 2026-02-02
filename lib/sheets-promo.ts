import { readSheet, updateSheet } from './google-sheets';
import type { PromoCode } from '@/types/admin';

interface SyncResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getPromoCodesFromSheets(): Promise<SyncResult<PromoCode[]>> {
  try {
    const rows = await readSheet('promo_codes', 'A2:G100');
    
    const codes: PromoCode[] = rows.map((row: unknown[]) => ({
      code: String(row[0] || ''),
      type: (row[1] as 'percentage' | 'fixed' | 'access') || 'percentage',
      value: parseFloat(String(row[2])) || 0,
      active: row[3] === 'TRUE' || row[3] === 'true',
      expiresAt: row[4] ? String(row[4]) : undefined,
      maxUses: row[5] ? parseInt(String(row[5])) : undefined,
      currentUses: parseInt(String(row[6])) || 0,
    }));
    
    return { success: true, data: codes };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to read promo codes' };
  }
}

export async function updatePromoCodeInSheets(code: string, currentUses: number): Promise<SyncResult<boolean>> {
  try {
    const rows = await readSheet('promo_codes', 'A2:G100');
    let rowIndex = -1;
    
    rows.forEach((row: any[], index: number) => {
      if (row[0] === code) {
        rowIndex = index + 2;
      }
    });
    
    if (rowIndex > 0) {
      await updateSheet('promo_codes', `G${rowIndex}`, [[currentUses]]);
      await getPromoCodesFromSheets();
      return { success: true, data: true };
    }
    
    return { success: false, error: 'Promo code not found' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update promo code' };
  }
}
