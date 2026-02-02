import { cart } from '../cart';

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  })
) as jest.Mock;

describe('Cart Functions', () => {
  beforeEach(async () => {
    localStorage.clear();
    await cart.clear();
  });

  test('cart.add agrega producto correctamente', async () => {
    const result = await cart.add({
      productId: 'test-1',
      name: 'Test Product',
      color: 'Negro',
      colorHex: '#000000',
      price: 50000,
      quantity: 1,
      image: '/test.jpg',
    });

    expect(result.success).toBe(true);
    expect(cart.getCount()).toBe(1);
    expect(cart.getTotal()).toBe(50000);
  });

  test('cart.add respeta límite de 5 items', async () => {
    for (let i = 0; i < 5; i++) {
      await cart.add({
        productId: `test-${i}`,
        name: 'Test Product',
        color: 'Negro',
        colorHex: '#000000',
        price: 50000,
        quantity: 1,
        image: '/test.jpg',
      });
    }

    const result = await cart.add({
      productId: 'test-6',
      name: 'Test Product',
      color: 'Negro',
      colorHex: '#000000',
      price: 50000,
      quantity: 1,
      image: '/test.jpg',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Máximo 5');
    expect(cart.getCount()).toBe(5);
  });

  test('cart.remove elimina producto correctamente', async () => {
    await cart.add({
      productId: 'test-1',
      name: 'Test Product',
      color: 'Negro',
      colorHex: '#000000',
      price: 50000,
      quantity: 1,
      image: '/test.jpg',
    });

    await cart.remove('test-1', 'Negro');
    expect(cart.getCount()).toBe(0);
  });

  test('cart.updateQuantity actualiza cantidad', async () => {
    await cart.add({
      productId: 'test-1',
      name: 'Test Product',
      color: 'Negro',
      colorHex: '#000000',
      price: 50000,
      quantity: 1,
      image: '/test.jpg',
    });

    await cart.updateQuantity('test-1', 'Negro', 3);
    expect(cart.getCount()).toBe(3);
    expect(cart.getTotal()).toBe(150000);
  });

  test('cart.clear vacía el carrito', async () => {
    await cart.add({
      productId: 'test-1',
      name: 'Test Product',
      color: 'Negro',
      colorHex: '#000000',
      price: 50000,
      quantity: 1,
      image: '/test.jpg',
    });

    await cart.clear();
    expect(cart.getCount()).toBe(0);
    expect(cart.get()).toEqual([]);
  });

  test('cart.getTotal calcula total correctamente', async () => {
    await cart.add({
      productId: 'test-1',
      name: 'Product 1',
      color: 'Negro',
      colorHex: '#000000',
      price: 50000,
      quantity: 2,
      image: '/test.jpg',
    });

    await cart.add({
      productId: 'test-2',
      name: 'Product 2',
      color: 'Blanco',
      colorHex: '#FFFFFF',
      price: 45000,
      quantity: 1,
      image: '/test.jpg',
    });

    expect(cart.getTotal()).toBe(145000);
  });
});
