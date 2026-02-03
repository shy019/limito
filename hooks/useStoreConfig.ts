// Shared store-config hook to prevent duplicate calls
import { useEffect, useState } from 'react';
import { apiCache } from '@/lib/api-cache';

interface StoreConfig {
  mode: 'active' | 'password' | 'soldout';
  zones?: any[];
}

let globalConfig: StoreConfig | null = null;
let configPromise: Promise<StoreConfig> | null = null;

export function useStoreConfig() {
  const [config, setConfig] = useState<StoreConfig | null>(globalConfig);
  const [loading, setLoading] = useState(!globalConfig);

  useEffect(() => {
    if (globalConfig) {
      setConfig(globalConfig);
      setLoading(false);
      return;
    }

    if (!configPromise) {
      configPromise = apiCache
        .fetch<{ config: StoreConfig }>('/api/store-config', undefined, 300000) // 5 min cache
        .then(data => {
          globalConfig = data.config;
          return data.config;
        });
    }

    configPromise.then(cfg => {
      setConfig(cfg);
      setLoading(false);
    });
  }, []);

  return { config, loading };
}

export function invalidateStoreConfig() {
  globalConfig = null;
  configPromise = null;
  apiCache.invalidate('store-config');
}
