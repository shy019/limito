import productsData from '@/public/data/products.json';

export interface Product {
  id: string;
  name: string;
  edition: string;
  type: string;
  description: string;
  descriptionEn: string;
  colors: {
    name: string;
    hex: string;
    price: number;
    stock: number;
    images: string[];
  }[];
  features: string[];
  available: boolean;
}

export function getProducts(): Product[] {
  return productsData.products as Product[];
}

export function getAvailableProducts(): Product[] {
  return getProducts().filter((p) => p.available && p.colors.some(c => c.stock > 0));
}

export function getProductById(id: string): Product | undefined {
  return getProducts().find((p) => p.id === id);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(price);
}
