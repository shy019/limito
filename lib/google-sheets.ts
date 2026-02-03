import { google } from 'googleapis';
import { getCache, setCache, clearCache } from './cache';
import { withRetry } from './resilience';

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;
const CACHE_TTL = 300000; // 5 minutos
const SHEETS_TIMEOUT = 15000;

type SheetRow = (string | number | boolean)[];

async function getAuthClient() {
  // Try env var first (for Vercel), then fall back to file (for local dev)
  if (process.env.GOOGLE_CREDENTIALS) {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return auth.getClient();
  }
  
  // Local development with file
  const path = await import('path');
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), 'google-credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth.getClient();
}

export async function appendToSheet(sheetName: string, values: SheetRow[]) {
  return withRetry(async () => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as never });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    clearCache(sheetName);
  }, { timeout: SHEETS_TIMEOUT });
}

export async function readSheet(sheetName: string, range = 'A:Z', useCache = true): Promise<SheetRow[]> {
  return withRetry(async () => {
    const cacheKey = `sheet:${sheetName}:${range}`;
    
    if (useCache) {
      const cached = getCache<SheetRow[]>(cacheKey, CACHE_TTL);
      if (cached) return cached;
    }

    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as never });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!${range}`,
    });

    const data = (response.data.values || []) as SheetRow[];
    setCache(cacheKey, data);
    return data;
  }, { timeout: SHEETS_TIMEOUT });
}

export async function updateSheet(sheetName: string, range: string, values: SheetRow[]) {
  return withRetry(async () => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as never });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!${range}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    clearCache(sheetName);
  }, { timeout: SHEETS_TIMEOUT });
}

export async function batchRead(requests: Array<{ sheetName: string; range?: string }>): Promise<SheetRow[][]> {
  return withRetry(async () => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as never });

    const ranges = requests.map(r => `${r.sheetName}!${r.range || 'A:Z'}`);
    
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges,
    });

    return (response.data.valueRanges || []).map(vr => (vr.values || []) as SheetRow[]);
  }, { timeout: SHEETS_TIMEOUT });
}

export async function batchUpdate(updates: Array<{ sheetName: string; range: string; values: SheetRow[] }>) {
  return withRetry(async () => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as never });

    const data = updates.map(u => ({
      range: `${u.sheetName}!${u.range}`,
      values: u.values,
    }));

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data,
      },
    });

    updates.forEach(u => clearCache(u.sheetName));
  }, { timeout: SHEETS_TIMEOUT });
}
