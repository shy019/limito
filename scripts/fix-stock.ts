import { google } from 'googleapis';
import path from 'path';

const SPREADSHEET_ID = '1NZOl7xjQIurs1ILrkZTJqV4QKTCtSMdb2b9TH0xpg_k';

async function fixStock() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), 'google-credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() as any });
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'products!H2',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [['4']],
    },
  });
  
  console.log('✅ Stock actualizado a 4');
}

fixStock().catch(console.error);
