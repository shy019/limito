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
    sessionStorage.clear();
    await cart.clear();
    (global.fetch as jest.Mock).mockClear();
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

  test('cart.sync removes items not in server reservations', async () => {
    // Add item to local cart
    localStorage.setItem('limito_cart', JSON.stringify([
      { productId: 'p1', color: 'Negro', quantity: 1, price: 50000 },
      { productId: 'p2', color: 'Blanco', quantity: 1, price: 45000 }
    ]));

    // Mock server returns only p1 as valid
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ validItems: [{ productId: 'p1', color: 'Negro' }] })
    });

    const synced = await cart.sync();
    expect(synced.length).toBe(1);
    expect(synced[0].productId).toBe('p1');
  });

  test('cart.sync returns all items if server fails', async () => {
    localStorage.setItem('limito_cart', JSON.stringify([
      { productId: 'p1', color: 'Negro', quantity: 1, price: 50000 }
    ]));

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    const synced = await cart.sync();
    expect(synced.length).toBe(1);
  });

  test('cart.getSessionId generates and persists session', () => {
    const id1 = cart.getSessionId();
    const id2 = cart.getSessionId();
    expect(id1).toBe(id2);
    expect(id1.length).toBeGreaterThan(0);
  });
});
