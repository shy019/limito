import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import LanguageSelector from '@/components/LanguageSelector';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import GlobalLoader from '@/components/GlobalLoader';
import { BackgroundProvider } from '@/contexts/BackgroundContext';
import { generateOrganizationSchema, generateWebsiteSchema } from '@/lib/seo';
import { getSettingsFromTurso } from '@/lib/turso-products-v2';
import "./globals.css";

const barlow = Barlow({ 
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-barlow"
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: {
    default: 'LIMITØ - Gorras Edición Limitada',
    template: '%s | LIMITØ'
  },
  description: 'Gorras urbanas de edición limitada. Cada pieza numerada y auténtica. Drops exclusivos en Colombia.',
  keywords: ['gorras', 'streetwear', 'edición limitada', 'urban', 'snapback', 'dad hat', 'Colombia', 'LIMITØ'],
  authors: [{ name: 'LIMITØ' }],
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'LIMITØ',
    title: 'LIMITØ - Gorras Edición Limitada',
    description: 'Gorras urbanas de edición limitada. Cada pieza numerada y auténtica.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LIMITØ - Gorras Edición Limitada',
    description: 'Gorras urbanas de edición limitada',
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebsiteSchema();
  
  // Cargar color de acento directamente desde la BD
  let accentColor = '#D4AF37';
  try {
    const settings = await getSettingsFromTurso();
    accentColor = settings?.accent_color || '#D4AF37';
  } catch (e) {
    // Usar default si falla
  }
  
  // Convertir a RGB
  const hex = accentColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return (
    <html lang={locale} style={{ 
      margin: 0, 
      padding: 0, 
      backgroundColor: 'transparent',
      '--accent-color': accentColor,
      '--accent-color-rgb': `${r}, ${g}, ${b}`,
      '--accent-glow-strong': `rgba(${r}, ${g}, ${b}, 0.75)`,
      '--accent-glow-weak': `rgba(${r}, ${g}, ${b}, 0.5)`,
      '--accent-glow-light': `rgba(${r}, ${g}, ${b}, 0.2)`
    } as React.CSSProperties}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={`${barlow.variable} antialiased`} style={{ margin: 0, padding: 0, backgroundColor: 'transparent' }}>
        <GoogleAnalytics />
        <BackgroundProvider>
          <NextIntlClientProvider messages={messages}>
            <GlobalLoader>
              {children}
            </GlobalLoader>
          </NextIntlClientProvider>
        </BackgroundProvider>
        <div id="modal-root"></div>
      </body>
    </html>
  );
}
