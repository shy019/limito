import fs from 'fs';
import path from 'path';
import { encrypt, decrypt } from './crypto';

export type StoreMode = 'password' | 'active' | 'soldout';

export interface StoreConfig {
  mode: StoreMode;
  passwordUntil: string | null;
}

const CONFIG_FILE = path.join(process.cwd(), 'data', 'config.enc');

function readEncryptedConfig(): StoreConfig {
  try {
    const encrypted = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const decrypted = decrypt(encrypted.trim());
    return JSON.parse(decrypted);
  } catch {
    const defaultConfig: StoreConfig = {
      mode: 'active',
      passwordUntil: null
    };
    writeEncryptedConfig(defaultConfig);
    return defaultConfig;
  }
}

function writeEncryptedConfig(config: StoreConfig): void {
  const json = JSON.stringify(config);
  const encrypted = encrypt(json);
  fs.writeFileSync(CONFIG_FILE, encrypted, 'utf-8');
}

export function getCurrentMode(): StoreMode {
  const config = readEncryptedConfig();
  
  if (config.mode === 'password' && config.passwordUntil) {
    const now = new Date();
    const until = new Date(config.passwordUntil);
    
    if (now > until) {
      config.mode = 'active';
      config.passwordUntil = null;
      writeEncryptedConfig(config);
      return 'active';
    }
  }
  
  return config.mode;
}

export function getStoreConfig(): StoreConfig {
  return readEncryptedConfig();
}

export function saveStoreConfig(config: StoreConfig): void {
  writeEncryptedConfig(config);
}
