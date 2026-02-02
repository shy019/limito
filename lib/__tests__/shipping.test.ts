import { calculateShipping } from '../shipping';

describe('Shipping', () => {
  describe('calculateShipping', () => {
    it('should calculate shipping for Bogotá', () => {
      const result = calculateShipping('Bogotá', 50000);
      expect(result.cost).toBe(8000);
      expect(result.isFree).toBe(false);
    });

    it('should calculate shipping for Chía', () => {
      const result = calculateShipping('Chía', 50000);
      expect(result.cost).toBe(8000);
      expect(result.isFree).toBe(false);
    });

    it('should return free shipping when threshold met', () => {
      const result = calculateShipping('Bogotá', 100000);
      expect(result.cost).toBe(0);
      expect(result.isFree).toBe(true);
    });

    it('should return nacional cost for unknown city', () => {
      const result = calculateShipping('Unknown City', 50000);
      expect(result.cost).toBe(15000);
      expect(result.zone.id).toBe('nacional');
    });
  });
});
