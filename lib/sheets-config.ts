import { readSheet, updateSheet } from './google-sheets';
import { clearCache } from './cache';

export async function getConfigFromSheets() {
  try {
    const rows = await readSheet('config', 'A2:B10');
    const config: Record<string, string> = {};
    
    rows.forEach((row: any[]) => {
      if (row[0] && row[1] !== undefined) {
        config[row[0]] = row[1];
      }
    });
    
    return config;
  } catch (error) {
    return null;
  }
}

export async function saveConfigToSheets(key: string, value: string) {
  try {
    const rows = await readSheet('config', 'A2:B10');
    let rowIndex = -1;
    
    rows.forEach((row: any[], index: number) => {
      if (row[0] === key) {
        rowIndex = index + 2; // +2 because A2 is row 2
      }
    });
    
    if (rowIndex > 0) {
      await updateSheet('config', `B${rowIndex}`, [[value]]);
      clearCache('config');
    }
    
    return true;
  } catch (error) {
    console.error('Error saving config to sheets:', error);
    return false;
  }
}
