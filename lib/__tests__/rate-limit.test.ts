import { rateLimit, cleanupRateLimit } from '../rate-limit';

describe('rate-limit', () => {
  beforeEach(() => {
    cleanupRateLimit();
  });

  describe('rateLimit', () => {
    it('should allow requests within limit', () => {
      const result1 = rateLimit('test-id', 3, 60000);
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(2);

      const result2 = rateLimit('test-id', 3, 60000);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(1);
    });

    it('should block requests exceeding limit', () => {
      rateLimit('test-id', 2, 60000);
      rateLimit('test-id', 2, 60000);
      
      const result = rateLimit('test-id', 2, 60000);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should handle different identifiers independently', () => {
      rateLimit('id-1', 2, 60000);
      rateLimit('id-1', 2, 60000);
      
      const result = rateLimit('id-2', 2, 60000);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(1);
    });
  });
});
