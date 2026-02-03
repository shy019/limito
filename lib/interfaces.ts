// Data repository interfaces - swap implementations without changing business logic

export interface Product {
  id: string;
  name: string;
  description?: string;
  colors: ProductColor[];
  active: boolean;
}

export interface ProductColor {
  name: string;
  hex: string;
  price: number;
  stock: number;
  images: string[];
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingDepartment?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  color: string;
  quantity: number;
  price: number;
}

export interface PromoCode {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  maxUses?: number;
  currentUses?: number;
  expiresAt?: string;
  grantsAccess?: boolean;
}

export interface Reservation {
  productId: string;
  color: string;
  quantity: number;
  sessionId: string;
  expiresAt: number;
}

export interface ShippingRate {
  department: string;
  city: string;
  price: number;
}

export interface StoreConfig {
  mode: 'active' | 'password' | 'soldout';
  backgroundUrl?: string;
}

// Repository interfaces
export interface IProductRepository {
  getAll(): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  create(product: Omit<Product, 'id'>): Promise<Product>;
  update(id: string, product: Partial<Product>): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}

export interface IOrderRepository {
  getAll(): Promise<Order[]>;
  getById(id: string): Promise<Order | null>;
  create(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order>;
  updateStatus(id: string, status: string): Promise<boolean>;
}

export interface IPromoRepository {
  getByCode(code: string): Promise<PromoCode | null>;
  incrementUses(code: string): Promise<boolean>;
}

export interface IReservationRepository {
  reserve(productId: string, color: string, quantity: number, sessionId: string, durationMs?: number): Promise<boolean>;
  release(productId: string, color: string, sessionId: string): Promise<void>;
  getAvailableStock(productId: string, color: string, totalStock: number, excludeSessionId?: string): Promise<number>;
  getActiveBySession(sessionId: string): Promise<Reservation[]>;
}

export interface IShippingRepository {
  getRates(): Promise<ShippingRate[]>;
  getRateForCity(department: string, city: string): Promise<number | null>;
}

export interface IConfigRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<boolean>;
}
