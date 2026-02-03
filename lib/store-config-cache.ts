// Cache en memoria para store-config usando el sistema unificado
import { apiCache } from './api-cache';

export async function fetchStoreConfig(): Promise<any> {
  return apiCache.fetch('/api/store-config', undefined, 300000); // 5 minutos
}
