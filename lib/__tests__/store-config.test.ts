import { getStoreConfig, saveStoreConfig, getCurrentMode, type StoreConfig } from '../store-config';

describe('Store Configuration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getStoreConfig', () => {
    it('should return default config when no config exists', () => {
      const config = getStoreConfig();
      expect(config.mode).toBe('password');
      expect(config.passwordUntil).toBeNull();
    });

    it('should return stored config when it exists', () => {
      const testConfig: StoreConfig = {
        mode: 'active',
        passwordUntil: '2024-12-31T23:59:59',
        backgroundImage: '/images/bg2.jpeg',
      };
      localStorage.setItem('limito_store_config', JSON.stringify(testConfig));

      const config = getStoreConfig();
      expect(config.mode).toBe('active');
      expect(config.passwordUntil).toBe('2024-12-31T23:59:59');
    });
  });

  describe('saveStoreConfig', () => {
    it('should save config to localStorage', () => {
      const testConfig: StoreConfig = {
        mode: 'soldout',
        passwordUntil: null,
        backgroundImage: '/images/bg2.jpeg',
      };

      saveStoreConfig(testConfig);

      const stored = localStorage.getItem('limito_store_config');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!).mode).toBe('soldout');
    });
  });

  describe('getCurrentMode', () => {
    it('should return password mode when no date is set', () => {
      const config: StoreConfig = {
        mode: 'password',
        passwordUntil: null,
        backgroundImage: '/images/bg2.jpeg',
      };
      saveStoreConfig(config);

      const mode = getCurrentMode();
      expect(mode).toBe('password');
    });

    it('should return password mode when date is in the future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const config: StoreConfig = {
        mode: 'password',
        passwordUntil: futureDate.toISOString(),
        backgroundImage: '/images/bg2.jpeg',
      };
      saveStoreConfig(config);

      const mode = getCurrentMode();
      expect(mode).toBe('password');
    });

    it('should automatically switch to active mode when password date has passed', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const config: StoreConfig = {
        mode: 'password',
        passwordUntil: pastDate.toISOString(),
        backgroundImage: '/images/bg2.jpeg',
      };
      saveStoreConfig(config);

      const mode = getCurrentMode();
      expect(mode).toBe('active');
    });

    it('should return active mode', () => {
      const config: StoreConfig = {
        mode: 'active',
        passwordUntil: null,
        backgroundImage: '/images/bg2.jpeg',
      };
      saveStoreConfig(config);

      const mode = getCurrentMode();
      expect(mode).toBe('active');
    });

    it('should return soldout mode', () => {
      const config: StoreConfig = {
        mode: 'soldout',
        passwordUntil: null,
        backgroundImage: '/images/bg2.jpeg',
      };
      saveStoreConfig(config);

      const mode = getCurrentMode();
      expect(mode).toBe('soldout');
    });
  });
});
