import { readSheet } from './google-sheets';

export async function getShippingRatesFromSheets() {
  try {
    const rows = await readSheet('shipping_rates', 'A2:E100');
    
    const zones = rows.map((row: any[]) => ({
      zone: row[0] || '',
      countries: row[1] ? row[1].split(',').map((c: string) => c.trim()) : [],
      rate: parseFloat(row[2]) || 0,
      deliveryDays: row[3] || '',
      deliveryDaysEn: row[4] || '',
    }));
    
    return zones;
  } catch (error) {
    console.error('Error reading shipping rates from sheets:', error);
    return null;
  }
}
