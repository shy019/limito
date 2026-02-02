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
    available: true,
    colors: [
      { name: 'Black', hex: '#000000', price: 80000, stock: 10, images: ['img1.jpg'] },
      { name: 'White', hex: '#FFFFFF', price: 85000, stock: 5, images: ['img2.jpg'] },
    ],
    features: ['Feature 1', 'Feature 2'],
  };

  beforeAll(() => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://limito.co';
    process.env.NEXT_PUBLIC_CONTACT_EMAIL = 'hola@limito.co';
  });

  describe('generateProductSchema', () => {
    it('should generate valid product schema', () => {
      const schema = generateProductSchema(mockProduct, 'Black', 'https://limito.co/img1.jpg');

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Product');
      expect(schema.name).toBe('Test Cap - Black');
      expect(schema.description).toBe('Test description');
      expect(schema.image).toBe('https://limito.co/img1.jpg');
      expect(schema.brand.name).toBe('LIMITØ');
      expect(schema.offers.price).toBe(80000);
      expect(schema.offers.priceCurrency).toBe('COP');
      expect(schema.offers.availability).toBe('https://schema.org/InStock');
    });

    it('should use first color if specified color not found', () => {
      const schema = generateProductSchema(mockProduct, 'NonExistent', 'https://limito.co/img.jpg');

      expect(schema.offers.price).toBe(80000);
    });

    it('should mark as out of stock when unavailable', () => {
      const unavailableProduct = { ...mockProduct, available: false };
      const schema = generateProductSchema(unavailableProduct, 'Black', 'https://limito.co/img.jpg');

      expect(schema.offers.availability).toBe('https://schema.org/OutOfStock');
    });
  });

  describe('generateOrganizationSchema', () => {
    it('should generate valid organization schema', () => {
      const schema = generateOrganizationSchema();

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Organization');
      expect(schema.name).toBe('LIMITØ');
      expect(schema.url).toBe('https://limito.co');
      expect(schema.contactPoint.email).toBe('hola@limito.co');
      expect(schema.contactPoint.areaServed).toBe('CO');
      expect(schema.sameAs).toHaveLength(2);
    });
  });

  describe('generateBreadcrumbSchema', () => {
    it('should generate valid breadcrumb schema', () => {
      const items = [
        { name: 'Home', url: 'https://limito.co' },
        { name: 'Catalog', url: 'https://limito.co/catalogo' },
        { name: 'Product', url: 'https://limito.co/producto/test-1' },
      ];

      const schema = generateBreadcrumbSchema(items);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(3);
      expect(schema.itemListElement[0].position).toBe(1);
      expect(schema.itemListElement[0].name).toBe('Home');
      expect(schema.itemListElement[2].position).toBe(3);
    });

    it('should handle empty items array', () => {
      const schema = generateBreadcrumbSchema([]);

      expect(schema.itemListElement).toHaveLength(0);
    });
  });

  describe('generateWebsiteSchema', () => {
    it('should generate valid website schema', () => {
      const schema = generateWebsiteSchema();

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('WebSite');
      expect(schema.name).toBe('LIMITØ');
      expect(schema.url).toBe('https://limito.co');
      expect(schema.potentialAction['@type']).toBe('SearchAction');
      expect(schema.potentialAction.target).toContain('/catalogo?q=');
    });
  });
});
