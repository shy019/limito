import { google } from 'googleapis';
import path from 'path';

const SPREADSHEET_ID = '1NZOl7xjQIurs1ILrkZTJqV4QKTCtSMdb2b9TH0xpg_k';

async function check() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), 'google-credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() as any });
  
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'products!A1:I10',
  });
  
  console.log(JSON.stringify(res.data.values, null, 2));
}

check().catch(console.error);
