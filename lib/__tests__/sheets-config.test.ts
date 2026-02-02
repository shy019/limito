import { getConfigFromSheets, saveConfigToSheets } from '../sheets-config';
import * as googleSheets from '../google-sheets';

jest.mock('../google-sheets');

describe('sheets-config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConfigFromSheets', () => {
    it('should return config from sheets', async () => {
      const mockRows = [
        ['admin_password', 'admin123'],
        ['promo_password', 'promo456'],
        ['store_mode', 'active'],
      ];
      
      (googleSheets.readSheet as jest.Mock).mockResolvedValue(mockRows);

      const config = await getConfigFromSheets();

      expect(config).toEqual({
        admin_password: 'admin123',
        promo_password: 'promo456',
        store_mode: 'active',
      });
    });

    it('should return null on error', async () => {
      (googleSheets.readSheet as jest.Mock).mockRejectedValue(new Error('API error'));

      const config = await getConfigFromSheets();

      expect(config).toBeNull();
    });
  });

  describe('saveConfigToSheets', () => {
    it('should save config value to sheets', async () => {
      const mockRows = [
        ['admin_password', 'old_password'],
        ['promo_password', 'promo456'],
      ];
      
      (googleSheets.readSheet as jest.Mock).mockResolvedValue(mockRows);
      (googleSheets.updateSheet as jest.Mock).mockResolvedValue(undefined);

      const result = await saveConfigToSheets('admin_password', 'new_password');

      expect(result).toBe(true);
      expect(googleSheets.updateSheet).toHaveBeenCalledWith('config', 'B2', [['new_password']]);
    });

    it('should return true even if key not found', async () => {
      (googleSheets.readSheet as jest.Mock).mockResolvedValue([]);

      const result = await saveConfigToSheets('new_key', 'value');

      expect(result).toBe(true);
    });
  });
});
