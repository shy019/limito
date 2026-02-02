import fs from 'fs';
import path from 'path';

export type SyncResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function syncToJSON(fileName: string, data: any): Promise<void> {
  const filePath = path.join(process.cwd(), 'public', 'data', fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function readFromJSON<T>(fileName: string): T | null {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', fileName);
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}
