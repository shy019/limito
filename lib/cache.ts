interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 120000; // 2 minutos (aumentado para reducir lecturas)
const MAX_CACHE_SIZE = 50; // Reducido de 100
const CLEANUP_INTERVAL = 120000; // 2 minutos (sincronizado con TTL)
let lastCleanup = Date.now();

function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL || cache.size > MAX_CACHE_SIZE) {
    cleanupExpired();
    lastCleanup = now;
  }
}

function cleanupExpired() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key);
    }
  }
}

export function getCache<T>(key: string, ttlMs: number): T | null {
  maybeCleanup();
  
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > ttlMs) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

export function setCache<T>(key: string, data: T, ttlMs = 300000): void {
  maybeCleanup();
  
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs
  });
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }
  
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}
