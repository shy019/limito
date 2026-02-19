import { formatPrice } from '../products';

describe('Products', () => {
  test('formatPrice formatea correctamente', () => {
    expect(formatPrice(50000)).toContain('50');
    expect(formatPrice(50000)).toContain('000');
    expect(formatPrice(1000)).toContain('1');
  });
});
