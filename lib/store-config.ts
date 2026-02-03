export type StoreMode = 'password' | 'active' | 'soldout' | 'maintenance';

export interface StoreConfig {
  mode: StoreMode;
  passwordUntil: string | null; // ISO date string
  backgroundImage: string;
}

const CONFIG_KEY = 'limito_store_config';

export function getStoreConfig(): StoreConfig {
  if (typeof window === 'undefined') {
    return {
      mode: 'password',
      passwordUntil: null,
      backgroundImage: '/images/bg2.jpeg',
    };
  }

  const stored = localStorage.getItem(CONFIG_KEY);
  if (stored) {
    const config = JSON.parse(stored);
    if (!config.backgroundImage) {
      config.backgroundImage = '/images/bg2.jpeg';
    }
    return config;
  }

  return {
    mode: 'password',
    passwordUntil: null,
    backgroundImage: '/images/bg2.jpeg',
  };
}

export function saveStoreConfig(config: StoreConfig): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }
}

export function getCurrentMode(): StoreMode {
  const config = getStoreConfig();
  
  // Si está en modo password y hay fecha límite
  if (config.mode === 'password' && config.passwordUntil) {
    const now = new Date();
    const until = new Date(config.passwordUntil);
    
    // Si ya pasó la fecha, cambiar automáticamente a activo
    if (now > until) {
      config.mode = 'active';
      saveStoreConfig(config);
      return 'active';
    }
  }
  
  return config.mode;
}
