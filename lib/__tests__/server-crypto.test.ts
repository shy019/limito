import { decryptFromTransit } from '../server-crypto';

describe('server-crypto', () => {
  // Simulate client-side encryption (same as password/cart pages)
  const encryptLikeClient = (text: string): string => {
    const key = Date.now().toString(36);
    const encoded = Buffer.from(text).toString('base64');
    const mixed = encoded.split('').map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join('');
    return `${key}:${Buffer.from(mixed, 'binary').toString('base64')}`;
  };

  it('decrypts simple text', () => {
    const encrypted = encryptLikeClient('PRUEBA3');
    expect(decryptFromTransit(encrypted)).toBe('PRUEBA3');
  });

  it('decrypts email', () => {
    const encrypted = encryptLikeClient('test@example.com');
    expect(decryptFromTransit(encrypted)).toBe('test@example.com');
  });

  it('decrypts phone number', () => {
    const encrypted = encryptLikeClient('+573001234567');
    expect(decryptFromTransit(encrypted)).toBe('+573001234567');
  });

  it('returns original if no colon separator', () => {
    expect(decryptFromTransit('plaintext')).toBe('plaintext');
  });

  it('returns empty string on invalid data', () => {
    expect(decryptFromTransit('invalid:!!!')).toBe('');
  });
});
