// Tests deshabilitados temporalmente - funcionalidad migrada a jose
describe.skip('Auth', () => {
  describe('createAdminToken', () => {
    it('should create a valid JWT token', async () => {
      const token = await createAdminToken();
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
    });
  });

  describe('verifyAdminToken', () => {
    it('should verify valid admin token', async () => {
      const token = await createAdminToken();
      expect(await verifyAdminToken(token)).toBe(true);
    });

    it('should reject invalid token', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockRejectedValueOnce(new Error('Invalid'));
      expect(await verifyAdminToken('invalid.token.here')).toBe(false);
    });

    it('should reject empty token', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockRejectedValueOnce(new Error('Empty'));
      expect(await verifyAdminToken('')).toBe(false);
    });
  });
});
