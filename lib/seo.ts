import { Product } from './products';

export function generateProductSchema(product: Product, _color: string, imageUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: imageUrl,
    brand: {
      '@type': 'Brand',
      name: 'LIMITØ'
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'COP',
      availability: product.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/catalogo`,
      seller: {
        '@type': 'Organization',
        name: 'LIMITØ'
      }
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      reviewCount: '1'
    }
  };
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LIMITØ',
    description: 'Gorras de edición limitada en Colombia',
    url: process.env.NEXT_PUBLIC_BASE_URL,
    logo: `${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      email: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
      contactType: 'Customer Service',
      areaServed: 'CO',
      availableLanguage: ['Spanish']
    },
    sameAs: [
      'https://instagram.com/limitohats',
      'https://tiktok.com/@limitohats'
    ]
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LIMITØ',
    url: process.env.NEXT_PUBLIC_BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${process.env.NEXT_PUBLIC_BASE_URL}/catalogo?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
}
