import { getProductsFromSheets, updateProductInSheets, deleteProductFromSheets } from '../sheets-products';
import * as googleSheets from '../google-sheets';

jest.mock('../google-sheets');

describe('sheets-products', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProductsFromSheets', () => {
    it('should return products from sheets', async () => {
      const mockRows = [
        ['prod-1', 'Product 1', '001', 'snapback', 'Desc ES', 'Desc EN', 'TRUE', '[{"name":"Black","hex":"#000000","images":["img1.jpg"]}]', 'feature1,feature2'],
      ];
      
      (googleSheets.readSheet as jest.Mock).mockResolvedValue(mockRows);

      const result = await getProductsFromSheets();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should return error on failure', async () => {
      (googleSheets.readSheet as jest.Mock).mockRejectedValue(new Error('API error'));

      const result = await getProductsFromSheets();

      expect(result.success).toBe(false);
    });
  });

  describe('updateProductInSheets', () => {
    it('should update product in sheets', async () => {
      const mockRows = [
        ['prod-1', 'Old Name', '001', 'snapback', 'Old Desc', 'Old Desc EN', 'FALSE', '[]', ''],
      ];
      
      (googleSheets.readSheet as jest.Mock).mockResolvedValue(mockRows);
      (googleSheets.updateSheet as jest.Mock).mockResolvedValue(undefined);

      const product = {
        id: 'prod-1',
        name: 'Updated Product',
        edition: '002',
        type: 'dad-hat',
        description: 'Updated Desc',
        descriptionEn: 'Updated Desc EN',
        available: true,
        colors: [{name: 'Blue', hex: '#0000FF', images: ['new.jpg']}],
        features: ['feature1'],
      };

      const result = await updateProductInSheets(product);

      expect(result.success).toBe(true);
      expect(googleSheets.updateSheet).toHaveBeenCalled();
    });

    it('should return false if product not found', async () => {
      (googleSheets.readSheet as jest.Mock).mockResolvedValue([]);

      const result = await updateProductInSheets({ id: 'non-existent' });

      expect(result.success).toBe(false);
    });
  });

  describe('deleteProductFromSheets', () => {
    it('should delete product from sheets', async () => {
      const mockRows = [
        ['prod-1', 'Product 1'],
        ['prod-2', 'Product 2'],
      ];
      
      (googleSheets.readSheet as jest.Mock).mockResolvedValue(mockRows);
      (googleSheets.updateSheet as jest.Mock).mockResolvedValue(undefined);

      const result = await deleteProductFromSheets('prod-1');

      expect(result.success).toBe(true);
      expect(googleSheets.updateSheet).toHaveBeenCalled();
    });

    it('should return false on error', async () => {
      (googleSheets.readSheet as jest.Mock).mockRejectedValue(new Error('API error'));

      const result = await deleteProductFromSheets('prod-1');

      expect(result.success).toBe(false);
    });
  });
});
