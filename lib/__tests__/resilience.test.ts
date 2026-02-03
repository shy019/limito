import { withRetry, withTimeout } from '../resilience';

describe('Resilience utilities', () => {
  describe('withTimeout', () => {
    it('resolves if operation completes in time', async () => {
      const result = await withTimeout(Promise.resolve('ok'), 1000);
      expect(result).toBe('ok');
    });

    it('rejects if operation times out', async () => {
      const slow = new Promise(resolve => setTimeout(() => resolve('late'), 500));
      await expect(withTimeout(slow, 50)).rejects.toThrow('Timeout');
    });
  });

  describe('withRetry', () => {
    it('returns on first success', async () => {
      const fn = jest.fn().mockResolvedValue('ok');
      const result = await withRetry(fn, { maxRetries: 3 });
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and succeeds', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('ok');
      
      const result = await withRetry(fn, { maxRetries: 3, baseDelay: 10 });
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('throws after max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('always fails'));
      
      await expect(withRetry(fn, { maxRetries: 2, baseDelay: 10 }))
        .rejects.toThrow('always fails');
      expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('uses exponential backoff', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('1'))
        .mockRejectedValueOnce(new Error('2'))
        .mockResolvedValue('ok');
      
      const start = Date.now();
      await withRetry(fn, { maxRetries: 3, baseDelay: 50 });
      const elapsed = Date.now() - start;
      
      // baseDelay=50: first retry 50ms, second retry 100ms = 150ms minimum
      expect(elapsed).toBeGreaterThanOrEqual(140);
    });
  });
});
