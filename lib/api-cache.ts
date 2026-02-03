// Client-side API cache to reduce duplicate calls
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private pending = new Map<string, Promise<any>>();
  private readonly defaultTTL = 120000; // 2 minutos

  async fetch<T>(url: string, options?: RequestInit, ttl: number = this.defaultTTL): Promise<T> {
    const cacheKey = `${url}:${JSON.stringify(options || {})}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    // Check if request is already pending (deduplication)
    const pending = this.pending.get(cacheKey);
    if (pending) {
      return pending;
    }

    // Make new request
    const promise = fetch(url, options)
      .then(res => res.json())
      .then(data => {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        this.pending.delete(cacheKey);
        return data;
      })
      .catch(err => {
        this.pending.delete(cacheKey);
        throw err;
      });

    this.pending.set(cacheKey, promise);
    return promise;
  }

  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
    this.pending.clear();
  }
}

export const apiCache = new APICache();
