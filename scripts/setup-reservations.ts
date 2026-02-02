import { google } from 'googleapis';
import path from 'path';

const SPREADSHEET_ID = '1NZOl7xjQIurs1ILrkZTJqV4QKTCtSMdb2b9TH0xpg_k';

async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), 'google-credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth.getClient();
}

async function setupReservations() {
  const authClient = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient as any });

  console.log('Creating reservations sheet headers...');
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'reservations!A1:E1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        ['productId', 'color', 'quantity', 'expiresAt', 'sessionId'],
      ],
    },
  });

  console.log('✅ Reservations sheet configured successfully!');
}

setupReservations().catch(console.error);
