import { getShippingRatesFromSheets } from '../sheets-shipping';
import * as googleSheets from '../google-sheets';

jest.mock('../google-sheets');

describe('sheets-shipping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getShippingRatesFromSheets', () => {
    it('should return shipping rates from sheets', async () => {
      const mockRows = [
        ['Bogotá', 'CO', '0', '1-2 días', '1-2 days'],
        ['Medellín', 'CO', '15000', '2-3 días', '2-3 days'],
      ];
      
      (googleSheets.readSheet as jest.Mock).mockResolvedValue(mockRows);

      const zones = await getShippingRatesFromSheets();

      expect(zones).toHaveLength(2);
      expect(zones![0]).toEqual({
        zone: 'Bogotá',
        countries: ['CO'],
        rate: 0,
        deliveryDays: '1-2 días',
        deliveryDaysEn: '1-2 days',
      });
      expect(zones![1]).toEqual({
        zone: 'Medellín',
        countries: ['CO'],
        rate: 15000,
        deliveryDays: '2-3 días',
        deliveryDaysEn: '2-3 days',
      });
    });

    it('should return null on error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (googleSheets.readSheet as jest.Mock).mockRejectedValue(new Error('API error'));

      const zones = await getShippingRatesFromSheets();

      expect(zones).toBeNull();
      consoleSpy.mockRestore();
    });
  });
});
