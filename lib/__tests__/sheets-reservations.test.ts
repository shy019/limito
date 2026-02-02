import { reserveStockInSheets, getAvailableStockFromSheets, releaseStockInSheets } from '../sheets-reservations';

describe('Stock Reservations', () => {
  
  it('should have reserveStockInSheets function', () => {
    expect(typeof reserveStockInSheets).toBe('function');
  });

  it('should have getAvailableStockFromSheets function', () => {
    expect(typeof getAvailableStockFromSheets).toBe('function');
  });

  it('should have releaseStockInSheets function', () => {
    expect(typeof releaseStockInSheets).toBe('function');
  });
});
