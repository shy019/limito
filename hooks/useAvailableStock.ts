import { useEffect, useState, useCallback, useRef } from 'react';

interface StockCacheEntry {
  stock: number;
  timestamp: number;
}

const stockCache: Record<string, StockCacheEntry> = {};
const CACHE_TTL = 30000;
const pendingFetches = new Map<string, Promise<void | undefined>>();

export function useAvailableStock(productId: string | null, initialStock?: number) {
  const [stock, setStock] = useState<number>(initialStock ?? 0);
  const [loading, setLoading] = useState(false);

  const fetchStock = useCallback(async (id: string) => {
    const cacheKey = `stock:${id}`;
    
    if (pendingFetches.has(cacheKey)) {
      return pendingFetches.get(cacheKey);
    }
    
    const cached = stockCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setStock(cached.stock);
      return;
    }

    setLoading(true);
    
    const fetchPromise = fetch(`/api/products/available-stock?productId=${id}`)
      .then(res => res.json())
      .then(data => {
        const availableStock = data.availableStock ?? 0;
        stockCache[cacheKey] = { stock: availableStock, timestamp: Date.now() };
        setStock(availableStock);
        pendingFetches.delete(cacheKey);
      })
      .catch(() => {
        pendingFetches.delete(cacheKey);
      })
      .finally(() => setLoading(false));
    
    pendingFetches.set(cacheKey, fetchPromise);
    return fetchPromise;
  }, []);

  useEffect(() => {
    if (productId) fetchStock(productId);
  }, [productId, fetchStock]);

  return { stock, loading, refetch: fetchStock };
}
