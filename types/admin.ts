export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    line1: string;
    city: string;
    state: string;
  };
  items: OrderItem[];
  total: number;
  status: 'pending' | 'shipped' | 'delivered';
  trackingNumber?: string;
  carrier?: string;
  createdAt: string;
}

export interface OrderItem {
  name: string;
  color: string;
  quantity: number;
  price: number;
}

export interface PromoCode {
  code: string;
  type: 'percentage' | 'fixed' | 'access';
  value: number;
  active: boolean;
  expiresAt?: string;
  maxUses?: number;
  currentUses?: number;
}

export interface Stats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}
