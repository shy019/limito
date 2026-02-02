import { readSheet, updateSheet, appendToSheet } from '../google-sheets';

describe('Google Sheets with Retry Logic', () => {
  
  it('should have readSheet function', () => {
    expect(typeof readSheet).toBe('function');
  });

  it('should have updateSheet function', () => {
    expect(typeof updateSheet).toBe('function');
  });

  it('should have appendToSheet function', () => {
    expect(typeof appendToSheet).toBe('function');
  });
});
