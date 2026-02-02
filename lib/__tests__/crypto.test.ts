import { encrypt, decrypt } from '../crypto';

describe('crypto', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-must-be-at-least-32-chars-long';
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text correctly', () => {
      const originalText = 'Hello World';
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);

      expect(encrypted).not.toBe(originalText);
      expect(decrypted).toBe(originalText);
    });

    it('should handle JSON objects', () => {
      const originalText = JSON.stringify({ mode: 'active', passwordUntil: null });
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it('should handle special characters', () => {
      const originalText = '¡Hola! ¿Cómo estás? 😀';
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it('should produce different encrypted values for same input (random IV)', () => {
      const text = 'Hello';
      const encrypted1 = encrypt(text);
      const encrypted2 = encrypt(text);

      expect(encrypted1).not.toBe(encrypted2);
      expect(decrypt(encrypted1)).toBe(text);
      expect(decrypt(encrypted2)).toBe(text);
    });

    it('should throw on invalid encrypted format', () => {
      expect(() => decrypt('invalid')).toThrow('Invalid encrypted format');
    });
  });
});
