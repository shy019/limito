export interface Product {
  id: string;
  name: string;
  edition: string;
  type: string;
  description: string;
  descriptionEn: string;
  price: number;
  stock: number;
  images: string[];
  features: string[];
  featuresEn: string[];
  available: boolean;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(price);
}
