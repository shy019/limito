import { getProducts, getAvailableProducts, getProductById, formatPrice } from '../products';

describe('Products Functions', () => {
  test('getProducts retorna todos los productos', () => {
    const products = getProducts();
    expect(products).toBeDefined();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);
  });

  test('getAvailableProducts retorna solo productos disponibles', () => {
    const products = getAvailableProducts();
    expect(products.every(p => p.available && p.colors.some(c => c.stock > 0))).toBe(true);
  });

  test('getProductById encuentra producto correcto', () => {
    const products = getProducts();
    if (products.length > 0) {
      const product = getProductById(products[0].id);
      expect(product).toBeDefined();
      expect(product?.id).toBe(products[0].id);
    }
  });

  test('getProductById retorna undefined para ID inexistente', () => {
    const product = getProductById('non-existent-id');
    expect(product).toBeUndefined();
  });

  test('formatPrice formatea correctamente en COP', () => {
    expect(formatPrice(50000)).toContain('50');
    expect(formatPrice(50000)).toContain('000');
    expect(formatPrice(1000)).toContain('1');
  });

  test('productos tienen estructura correcta', () => {
    const products = getProducts();
    const product = products[0];

    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('available');
    expect(product).toHaveProperty('colors');
    expect(product).toHaveProperty('features');
    expect(Array.isArray(product.colors)).toBe(true);
    expect(Array.isArray(product.features)).toBe(true);
    
    if (product.colors.length > 0) {
      expect(product.colors[0]).toHaveProperty('price');
      expect(product.colors[0]).toHaveProperty('stock');
    }
  });

  test('colores tienen imágenes válidas', () => {
    const products = getProducts();
    products.forEach(product => {
      product.colors.forEach(color => {
        expect(color).toHaveProperty('name');
        expect(color).toHaveProperty('hex');
        expect(color).toHaveProperty('images');
        expect(Array.isArray(color.images)).toBe(true);
        expect(color.images.length).toBeGreaterThan(0);
      });
    });
  });
});
