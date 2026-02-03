// Shared products hook with lazy loading
import { useEffect, useState } from 'react';
import { apiCache } from '@/lib/api-cache';
import type { Product } from '@/lib/products';

interface ProductsResponse {
  products: Product[];
  metadata: any;
}

let globalProducts: Product[] | null = null;
let productsPromise: Promise<Product[]> | null = null;

export function useProducts(lazy: boolean = false) {
  const [products, setProducts] = useState<Product[]>(globalProducts || []);
  const [loading, setLoading] = useState(!globalProducts && !lazy);

  const loadProducts = async (forceRefresh = false) => {
    if (globalProducts && !forceRefresh) {
      setProducts(globalProducts);
      setLoading(false);
      return;
    }

    if (!productsPromise || forceRefresh) {
      const url = forceRefresh 
        ? `/api/products?t=${Date.now()}` 
        : '/api/products';
      
      productsPromise = apiCache
        .fetch<ProductsResponse>(url, { 
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        }, 120000) // 2 min cache
        .then(data => {
          globalProducts = data.products;
          return data.products;
        });
    }

    setLoading(true);
    productsPromise.then(prods => {
      setProducts(prods);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!lazy) {
      loadProducts();
    }
  }, [lazy]);

  return { products, loading, loadProducts };
}

export function invalidateProducts() {
  globalProducts = null;
  productsPromise = null;
  apiCache.invalidate('products');
}
