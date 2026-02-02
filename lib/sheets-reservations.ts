import { readSheet, updateSheet, appendToSheet } from './google-sheets';

interface StockReservation {
  productId: string;
  color: string;
  quantity: number;
  expiresAt: number;
  sessionId: string;
}

export async function reserveStockInSheets(
  productId: string,
  color: string,
  quantity: number,
  sessionId: string,
  durationMs = 900000
): Promise<boolean> {
  try {
    await cleanExpiredReservations();
    
    const rows = await readSheet('reservations', 'A2:E1000', false);
    
    if (rows.filter(r => r[0]).length >= 999) {
      console.error('Reservations sheet is full');
      return false;
    }
    
    const existingIndex = rows.findIndex(
      (row) => row[0] === productId && row[1] === color && row[4] === sessionId
    );
    
    const expiresAt = Date.now() + durationMs;
    const newRow = [productId, color, quantity, expiresAt, sessionId];
    
    if (existingIndex >= 0) {
      await updateSheet('reservations', `A${existingIndex + 2}:E${existingIndex + 2}`, [newRow]);
    } else {
      await appendToSheet('reservations', [newRow]);
    }
    
    return true;
  } catch (error) {
    console.error('Error reserving stock in sheets:', error);
    return false;
  }
}

export async function releaseStockInSheets(
  productId: string,
  color: string,
  sessionId: string
): Promise<void> {
  try {
    const rows = await readSheet('reservations', 'A2:E1000', false);
    const filteredRows = rows.filter(
      (row) => !(row[0] === productId && row[1] === color && row[4] === sessionId)
    );
    
    if (filteredRows.length !== rows.length) {
      const emptyRows = Array(1000).fill([]).map(() => ['', '', '', '', '']);
      await updateSheet('reservations', 'A2:E1001', emptyRows);
      
      if (filteredRows.length > 0) {
        await updateSheet('reservations', `A2:E${filteredRows.length + 1}`, filteredRows);
      }
    }
  } catch (error) {
    console.error('Error releasing stock in sheets:', error);
  }
}

export async function getAvailableStockFromSheets(
  productId: string,
  color: string,
  totalStock: number,
  excludeSessionId?: string
): Promise<number> {
  try {
    await cleanExpiredReservations();
    
    const rows = await readSheet('reservations', 'A2:E1000', false);
    const now = Date.now();
    
    const totalReserved = rows
      .filter((row) => 
        row[0] &&
        row[0] === productId && 
        row[1] === color && 
        Number(row[3]) > now &&
        (!excludeSessionId || row[4] !== excludeSessionId)
      )
      .reduce((sum, row) => sum + Number(row[2] || 0), 0);
    
    return Math.max(0, totalStock - totalReserved);
  } catch (error) {
    console.error('Error getting available stock from sheets:', error);
    return totalStock;
  }
}

const LOCK_KEY = 'clean-lock';
const LOCK_DURATION = 5000;
const locks = new Map<string, number>();

async function acquireLock(key: string): Promise<boolean> {
  const now = Date.now();
  const existing = locks.get(key);
  
  if (existing && existing > now) {
    return false;
  }
  
  locks.set(key, now + LOCK_DURATION);
  return true;
}

function releaseLock(key: string): void {
  locks.delete(key);
}

async function cleanExpiredReservations(): Promise<void> {
  if (!await acquireLock(LOCK_KEY)) {
    return;
  }
  
  try {
    const rows = await readSheet('reservations', 'A2:E1000', false);
    const now = Date.now();
    const validRows = rows.filter((row) => row[0] && Number(row[3]) > now);
    
    if (validRows.length !== rows.length) {
      const emptyRows = Array(1000).fill([]).map(() => ['', '', '', '', '']);
      await updateSheet('reservations', 'A2:E1001', emptyRows);
      
      if (validRows.length > 0) {
        await updateSheet('reservations', `A2:E${validRows.length + 1}`, validRows);
      }
    }
  } catch (error) {
    console.error('Error cleaning expired reservations:', error);
  } finally {
    releaseLock(LOCK_KEY);
  }
}

export async function clearAllReservationsInSheets(): Promise<void> {
  try {
    const emptyRows = Array(1000).fill([]).map(() => ['', '', '', '', '']);
    await updateSheet('reservations', 'A2:E1001', emptyRows);
  } catch (error) {
    console.error('Error clearing all reservations:', error);
  }
}
