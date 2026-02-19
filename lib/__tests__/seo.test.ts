import {
  generateProductSchema,
  generateOrganizationSchema,
  generateBreadcrumbSchema,
  generateWebsiteSchema,
} from '../seo';
import type { Product } from '../products';

describe('seo', () => {
  const mockProduct: Product = {
    id: 'test-1',
    name: 'Test Cap',
    edition: '001',
    type: 'snapback',
    description: 'Test description',
    descriptionEn: 'Test description EN',
    price: 80000,
    stock: 10,
    images: ['img1.jpg', 'img2.jpg'],
    features: ['Feature 1', 'Feature 2'],
    available: true,
  };

  beforeAll(() => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://www.limitohats.com';
    process.env.NEXT_PUBLIC_CONTACT_EMAIL = 'limitohats@gmail.com';
  });

  describe('generateProductSchema', () => {
    it('should generate valid product schema', () => {
      const schema = generateProductSchema(mockProduct, '', 'https://www.limitohats.com/img1.jpg');

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Product');
      expect(schema.name).toBe('Test Cap');
      expect(schema.description).toBe('Test description');
      expect(schema.image).toBe('https://www.limitohats.com/img1.jpg');
      expect(schema.brand.name).toBe('LIMITØ');
      expect(schema.offers.price).toBe(80000);
      expect(schema.offers.priceCurrency).toBe('COP');
      expect(schema.offers.availability).toBe('https://schema.org/InStock');
    });

    it('should mark as out of stock when unavailable', () => {
      const unavailableProduct = { ...mockProduct, available: false };
      const schema = generateProductSchema(unavailableProduct, '', 'https://www.limitohats.com/img.jpg');

      expect(schema.offers.availability).toBe('https://schema.org/OutOfStock');
    });
  });

  describe('generateOrganizationSchema', () => {
    it('should generate valid organization schema', () => {
      const schema = generateOrganizationSchema();

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Organization');
      expect(schema.name).toBe('LIMITØ');
      expect(schema.url).toBe('https://www.limitohats.com');
      expect(schema.contactPoint.email).toBe('limitohats@gmail.com');
      expect(schema.contactPoint.areaServed).toBe('CO');
      expect(schema.sameAs).toHaveLength(2);
    });
  });

  describe('generateBreadcrumbSchema', () => {
    it('should generate valid breadcrumb schema', () => {
      const items = [
        { name: 'Home', url: 'https://www.limitohats.com' },
        { name: 'Catalog', url: 'https://www.limitohats.com/catalogo' },
      ];

      const schema = generateBreadcrumbSchema(items);

      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(2);
      expect(schema.itemListElement[0].position).toBe(1);
    });

    it('should handle empty items array', () => {
      const schema = generateBreadcrumbSchema([]);
      expect(schema.itemListElement).toHaveLength(0);
    });
  });

  describe('generateWebsiteSchema', () => {
    it('should generate valid website schema', () => {
      const schema = generateWebsiteSchema();

      expect(schema['@type']).toBe('WebSite');
      expect(schema.name).toBe('LIMITØ');
      expect(schema.potentialAction.target).toContain('/catalogo?q=');
    });
  });
});
