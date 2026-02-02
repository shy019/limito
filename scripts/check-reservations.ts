import { readSheet } from '../lib/google-sheets';

async function checkReservations() {
  try {
    const rows = await readSheet('reservations', 'A2:E1000');
    console.log('Total reservations:', rows.length);
    
    const now = Date.now();
    rows.forEach((row, idx) => {
      if (row[0]) {
        const expiresAt = Number(row[3]);
        const expired = expiresAt < now;
        console.log(`Row ${idx + 2}: Product=${row[0]}, Color=${row[1]}, Qty=${row[2]}, Expires=${new Date(expiresAt).toISOString()}, SessionId=${row[4]}, Expired=${expired}`);
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkReservations();
