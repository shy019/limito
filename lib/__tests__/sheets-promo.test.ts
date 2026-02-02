import { getPromoCodesFromSheets, updatePromoCodeInSheets } from '../sheets-promo';
import * as googleSheets from '../google-sheets';

jest.mock('../google-sheets');

describe('sheets-promo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPromoCodesFromSheets', () => {
    it('should return promo codes from sheets', async () => {
      const mockRows = [
        ['CODE123', 'percentage', '10', 'TRUE', '2025-12-31', '100', '5'],
      ];
      
      (googleSheets.readSheet as jest.Mock).mockResolvedValue(mockRows);

      const result = await getPromoCodesFromSheets();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0]).toEqual({
        code: 'CODE123',
        type: 'percentage',
        value: 10,
        active: true,
        expiresAt: '2025-12-31',
        maxUses: 100,
        currentUses: 5,
      });
    });

    it('should return error on failure', async () => {
      (googleSheets.readSheet as jest.Mock).mockRejectedValue(new Error('API error'));

      const result = await getPromoCodesFromSheets();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('updatePromoCodeInSheets', () => {
    it('should update promo code uses', async () => {
      const mockRows = [
        ['CODE123', 'percentage', '10', 'TRUE', '2025-12-31', '100', '5'],
      ];
      
      (googleSheets.readSheet as jest.Mock).mockResolvedValue(mockRows);
      (googleSheets.updateSheet as jest.Mock).mockResolvedValue(undefined);

      const result = await updatePromoCodeInSheets('CODE123', 10);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(googleSheets.updateSheet).toHaveBeenCalledWith('promo_codes', 'G2', [[10]]);
    });

    it('should return error if code not found', async () => {
      (googleSheets.readSheet as jest.Mock).mockResolvedValue([]);

      const result = await updatePromoCodeInSheets('NOTFOUND', 10);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
