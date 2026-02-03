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
const SESSION_TIMESTAMP_KEY = 'limito_session_timestamp';
const SESSION_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_ITEMS = 5;
const RESERVATION_DURATION = 900000;

const syncTimeout: NodeJS.Timeout | null = null;
let lastSync = 0;
const SYNC_DEBOUNCE = 2000; // 2 segundos entre syncs
const pendingReserves = new Map<string, Promise<CartResult>>(); // Deduplicación de reserves

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  const timestamp = sessionStorage.getItem(SESSION_TIMESTAMP_KEY);
  const now = Date.now();
  
  // Check if session expired (5 minutes)
  if (timestamp && (now - parseInt(timestamp, 10)) > SESSION_DURATION) {
    // Session expired, clear everything
    sessionStorage.clear();
    localStorage.removeItem(CART_KEY);
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (name.startsWith('limito_') || name === 'user_token') {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
    window.location.href = '/password';
    return '';
  }
  
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
    sessionStorage.setItem(SESSION_TIMESTAMP_KEY, now.toString());
  }
  return sessionId;
}

function refreshSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
}

export const cart = {
  get: (): CartItem[] => {
    if (typeof window === 'undefined') return [];
    refreshSession(); // Refresh session on every cart access
    try {
      const data = localStorage.getItem(CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Sync with server reservations (debounced)
  sync: async (): Promise<CartItem[]> => {
    if (typeof window === 'undefined') return [];
    
    // Debounce: no hacer sync si ya se hizo hace menos de 2 segundos
    const now = Date.now();
    if (now - lastSync < SYNC_DEBOUNCE) {
      return cart.get();
    }
    
    refreshSession(); // Refresh session
    try {
      const items = cart.get();
      if (items.length === 0) return [];

      lastSync = now;
      const sessionId = getSessionId();
      const res = await fetch('/api/cart/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, items: items.map(i => ({ productId: i.productId, color: i.color })) }),
      });

      if (!res.ok) return items;

      const { validItems } = await res.json();
      const validKeys = new Set(validItems.map((v: {productId: string, color: string}) => `${v.productId}-${v.color}`));
      const synced = items.filter(i => validKeys.has(`${i.productId}-${i.color}`));

      if (synced.length !== items.length) {
        localStorage.setItem(CART_KEY, JSON.stringify(synced));
        window.dispatchEvent(new Event('cart-updated'));
      }

      return synced;
    } catch {
      return cart.get();
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
      
      // FLUJO PRECISO: Esperar confirmación del servidor ANTES de agregar al carrito
      const reserveResponse = await fetch('/api/cart/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          color: item.color,
          quantity: newTotalQuantity,
          sessionId,
        }),
      });

      const reserveData = await reserveResponse.json();

      if (!reserveData.success) {
        // Si falla, NO agregar al carrito
        return { success: false, error: reserveData.error || 'Error al reservar' };
      }

      // Solo si la reserva fue exitosa, agregar al carrito local
      if (existing) {
        existing.quantity = newTotalQuantity;
        existing.reservedAt = Date.now();
      } else {
        items.push({ ...item, quantity: item.quantity, reservedAt: Date.now() } as CartItem);
      }
      
      localStorage.setItem(CART_KEY, JSON.stringify(items));
      window.dispatchEvent(new Event('cart-updated'));
      
      return { success: true };
    } catch (error) {
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
