import { createAdminToken, verifyAdminToken } from '../auth';

describe('Auth', () => {
  describe('createAdminToken', () => {
    it('should create a valid JWT token', () => {
      const token = createAdminToken();
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyAdminToken', () => {
    it('should verify valid admin token', () => {
      const token = createAdminToken();
      expect(verifyAdminToken(token)).toBe(true);
    });

    it('should reject invalid token', () => {
      expect(verifyAdminToken('invalid.token.here')).toBe(false);
    });

    it('should reject empty token', () => {
      expect(verifyAdminToken('')).toBe(false);
    });
  });
});
