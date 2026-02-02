export interface CartItem {
  productId: string;
  name: string;
  price: number;
  color: string;
  colorHex: string;
  quantity: number;
  image: string;
  reservedAt: number;
}

interface CartResult {
  success: boolean;
  error?: string;
}

const CART_KEY = 'limito_cart';
const SESSION_KEY = 'limito_session_id';
const MAX_ITEMS = 5;
const RESERVATION_DURATION = 900000;

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export const cart = {
  get: (): CartItem[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(CART_KEY);
      const items: CartItem[] = data ? JSON.parse(data) : [];
      
      const now = Date.now();
      const validItems = items.filter(item => 
        !item.reservedAt || (now - item.reservedAt) < RESERVATION_DURATION
      );
      
      if (validItems.length !== items.length) {
        localStorage.setItem(CART_KEY, JSON.stringify(validItems));
      }
      
      return validItems;
    } catch {
      return [];
    }
  },

  getSessionId: (): string => {
    return getSessionId();
  },

  add: async (item: Omit<CartItem, 'quantity' | 'reservedAt'> & { quantity: number }): Promise<CartResult> => {
    try {
      const items = cart.get();
      const existing = items.find(
        i => i.productId === item.productId && i.color === item.color
      );
      const currentQuantity = existing ? existing.quantity : 0;
      const newTotalQuantity = currentQuantity + item.quantity;
      const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

      if (totalQuantity >= MAX_ITEMS) {
        return { success: false, error: `Máximo ${MAX_ITEMS} gorras por compra` };
      }

      const sessionId = getSessionId();
      const res = await fetch('/api/cart/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          color: item.color,
          quantity: newTotalQuantity,
          sessionId,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        return { success: false, error: data.error || 'Stock no disponible' };
      }

      if (existing) {
        existing.quantity = newTotalQuantity;
        existing.reservedAt = Date.now();
      } else {
        items.push({ ...item, quantity: item.quantity, reservedAt: Date.now() } as CartItem);
      }

      localStorage.setItem(CART_KEY, JSON.stringify(items));
      
      // Limpiar cache
      await fetch('/api/cache/clear', { method: 'POST' }).catch(() => {});
      
      window.dispatchEvent(new Event('cart-updated'));
      return { success: true };
    } catch {
      return { success: false, error: 'Error al agregar al carrito' };
    }
  },

  remove: async (productId: string, color: string): Promise<void> => {
    try {
      const sessionId = getSessionId();
      await fetch('/api/cart/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, color, sessionId }),
      });

      const items = cart.get().filter(
        i => !(i.productId === productId && i.color === color)
      );
      localStorage.setItem(CART_KEY, JSON.stringify(items));
      
      // Limpiar cache
      await fetch('/api/cache/clear', { method: 'POST' }).catch(() => {});
      
      window.dispatchEvent(new Event('cart-updated'));
    } catch {}
  },

  updateQuantity: async (productId: string, color: string, quantity: number): Promise<CartResult> => {
    try {
      const items = cart.get();
      const item = items.find(i => i.productId === productId && i.color === color);
      if (item) {
        const sessionId = getSessionId();
        const res = await fetch('/api/cart/reserve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            color,
            quantity: Math.max(1, Math.min(MAX_ITEMS, quantity)),
            sessionId,
          }),
        });
        
        const data = await res.json();
        
        if (!data.success) {
          return { success: false, error: data.error || 'Error al actualizar cantidad' };
        }
        
        item.quantity = Math.max(1, Math.min(MAX_ITEMS, quantity));
        item.reservedAt = Date.now();
        localStorage.setItem(CART_KEY, JSON.stringify(items));
        
        // Limpiar cache
        await fetch('/api/cache/clear', { method: 'POST' }).catch(() => {});
        
        window.dispatchEvent(new Event('cart-updated'));
        return { success: true };
      }
      return { success: false, error: 'Item no encontrado' };
    } catch {
      return { success: false, error: 'Error al actualizar cantidad' };
    }
  },

  clear: async (): Promise<void> => {
    try {
      const items = cart.get();
      const sessionId = getSessionId();

      for (const item of items) {
        await fetch('/api/cart/release', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            productId: item.productId, 
            color: item.color, 
            sessionId 
          }),
        });
      }

      localStorage.removeItem(CART_KEY);
      
      // Limpiar cache
      await fetch('/api/cache/clear', { method: 'POST' }).catch(() => {});
      
      window.dispatchEvent(new Event('cart-updated'));
    } catch {}
  },

  getTotal: (): number => {
    return cart.get().reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getCount: (): number => {
    return cart.get().reduce((sum, item) => sum + item.quantity, 0);
  },
};
