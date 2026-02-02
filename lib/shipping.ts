import shippingRates from '@/public/data/shipping-rates.json';

export interface ShippingZone {
  id: string;
  name: string;
  cities: string[];
  cost: number;
  deliveryDays: string;
  deliveryDaysEn: string;
}

export function calculateShipping(city: string, subtotal: number): {
  cost: number;
  zone: ShippingZone;
  isFree: boolean;
} {
  const normalizedCity = city.trim().toLowerCase();
  
  // Check free shipping threshold
  const isFree = subtotal >= shippingRates.freeShippingThreshold;
  
  // Find matching zone
  let zone = shippingRates.zones.find(z => 
    z.cities.some(c => c.toLowerCase() === normalizedCity)
  );
  
  // Default to national if no match
  if (!zone) {
    zone = shippingRates.zones.find(z => z.id === 'nacional')!;
  }
  
  return {
    cost: isFree ? 0 : zone.cost,
    zone,
    isFree
  };
}

export function getShippingZones(): ShippingZone[] {
  return shippingRates.zones;
}
