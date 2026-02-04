// Debounced available stock fetcher
import { useEffect, useState, useCallback, useRef } from 'react';

interface StockCache {
  [key: string]: {
    stock: number;
    timestamp: number;
  };
}

const stockCache: StockCache = {};
const CACHE_TTL = 30000; // 30 segundos
const pendingFetches = new Map<string, Promise<void | undefined>>(); // Deduplicación

export function useAvailableStock(productId: string | null) {
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const fetchStock = useCallback(async (id: string) => {
    const cacheKey = `stock:${id}`;
    
    // Si ya hay un fetch pendiente, retornar ese
    if (pendingFetches.has(cacheKey)) {
      return pendingFetches.get(cacheKey);
    }
    
    const cached = stockCache[cacheKey];
    
    // Return cached if fresh
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setStockMap(prev => ({ ...prev, [id]: cached.stock }));
      return;
    }

    setLoading(true);
    
    const fetchPromise = fetch(`/api/products/available-stock?productId=${id}&t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    })
      .then(res => res.json())
      .then(data => {
        const map: Record<string, number> = {};
        data.availableStock.forEach((item: { name: string; availableStock: number }) => {
          map[item.name] = item.availableStock;
          stockCache[`${cacheKey}:${item.name}`] = {
            stock: item.availableStock,
            timestamp: Date.now()
          };
        });
        
        setStockMap(map);
        pendingFetches.delete(cacheKey);
      })
      .catch(error => {
        console.error('Error fetching stock:', error);
        pendingFetches.delete(cacheKey);
      })
      .finally(() => {
        setLoading(false);
      });
    
    pendingFetches.set(cacheKey, fetchPromise);
    return fetchPromise;
  }, []);

  const debouncedFetch = useCallback((id: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      fetchStock(id);
    }, 500); // 500ms debounce
  }, [fetchStock]);

  useEffect(() => {
    if (productId) {
      debouncedFetch(productId);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [productId, debouncedFetch]);

  return { stockMap, loading, refetch: fetchStock };
}
