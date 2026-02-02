import { getCache, setCache, clearCache } from '../cache';

describe('Cache', () => {
  
  it('should set and get cache', () => {
    setCache('test-key', { data: 'test' });
    const result = getCache('test-key', 10000);
    expect(result).toEqual({ data: 'test' });
  });

  it('should return null for expired cache', () => {
    setCache('expired-key', { data: 'test' });
    const result = getCache('expired-key', -1);
    expect(result).toBeNull();
  });

  it('should clear cache by key', () => {
    setCache('clear-key', { data: 'test' });
    clearCache('clear-key');
    const result = getCache('clear-key', 10000);
    expect(result).toBeNull();
  });

  it('should return null for non-existent key', () => {
    const result = getCache('non-existent', 10000);
    expect(result).toBeNull();
  });
});
