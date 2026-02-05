'use client';
import { fetchStoreConfig } from '@/lib/store-config-cache';


import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';
import BackgroundOverlay from '@/components/BackgroundOverlay';

export default function PoliticasPage() {
  const [locale, setLocale] = useState('es');
  const [mounted, setMounted] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const t = useTranslations('policies');

  useEffect(() => {
    const isPublicPage = true; // Policies is always public
    
    fetchStoreConfig()
      .then(data => data)
      .then(data => {
        const mode = data.config.mode;
        
        if (!isPublicPage) {
          if (mode === 'soldout') {
            window.location.href = '/soldout';
            return;
          }
          
          if (mode === 'password') {
            const token = sessionStorage.getItem('user_token');
            if (!token) {
              window.location.href = '/password';
              return;
            }
          }
        }
        
        setMounted(true);
        const cookies = document.cookie.split('; ');
        const localeCookie = cookies.find(c => c.startsWith('NEXT_LOCALE='));
        if (localeCookie) {
          setLocale(localeCookie.split('=')[1]);
        }
        setTimeout(() => setPageLoading(false), 100);
      })
      .catch(() => setTimeout(() => setPageLoading(false), 100));
  }, []);

  if (pageLoading) return <LoadingScreen />;
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <BackgroundOverlay />

      <header className="sticky top-0 z-40" style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-5xl mx-auto px-6 md:px-12 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:scale-110 transition-transform" style={{ color: 'var(--accent-color, #ffd624)' }}>
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-black" style={{ color: '#ffffff' }}>{t('title')}</h1>
          </div>
          {mounted && (
            <button onClick={() => {
              const newLocale = locale === 'es' ? 'en' : 'es';
              document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
              window.location.reload();
            }} className="text-2xl rounded-full w-12 h-12 shadow-lg flex items-center justify-center hover:scale-110 transition-transform" style={{ backgroundColor: 'rgba(var(--accent-color-rgb, 255, 214, 36), 0.1)' }}>
              {locale === 'es' ? '🇪🇸' : '🇺🇸'}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 md:px-12 py-12 space-y-8" style={{ position: 'relative', zIndex: 10, marginLeft: '2rem', marginRight: '2rem' }}>
        {/* Términos y Condiciones */}
        <section className="bg-black/40 backdrop-blur-md p-6 md:p-10 rounded-2xl transition-all duration-300 hover:bg-black/50 hover:scale-[1.01]">
          <h2 className="text-xl md:text-2xl font-black mb-6" style={{ color: 'var(--accent-color, #ffd624)' }}>{t('termsTitle')}</h2>
          <div className="space-y-4 text-sm md:text-base leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            <p>{t('termsText1')}</p>
            <p><strong style={{ color: 'var(--accent-color, #ffd624)' }}>{locale === 'es' ? 'Razón Social:' : 'Legal Name:'}</strong> {t('termsText2').replace(/^.*?: /, '')}</p>
            <p><strong style={{ color: 'var(--accent-color, #ffd624)' }}>{locale === 'es' ? 'Productos:' : 'Products:'}</strong> {t('termsText3').replace(/^.*?: /, '')}</p>
          </div>
        </section>

        {/* Derecho de Retracto */}
        <section className="bg-black/40 backdrop-blur-md p-6 md:p-10 rounded-2xl transition-all duration-300 hover:bg-black/50 hover:scale-[1.01]">
          <h2 className="text-xl md:text-2xl font-black mb-6" style={{ color: 'var(--accent-color, #ffd624)' }}>{t('retractionTitle')}</h2>
          <div className="space-y-4 text-sm md:text-base leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            <p>{t('retractionText1')}</p>
            <p><strong style={{ color: 'var(--accent-color, #ffd624)' }}>{t('retractionText2')}</strong></p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t('retractionItem1')}</li>
              <li>{t('retractionItem2')}</li>
              <li>{t('retractionItem3')}</li>
              <li>{t('retractionItem4')}</li>
            </ul>
          </div>
        </section>

        {/* Política de Envíos */}
        <section className="bg-black/40 backdrop-blur-md p-6 md:p-10 rounded-2xl transition-all duration-300 hover:bg-black/50 hover:scale-[1.01]">
          <h2 className="text-xl md:text-2xl font-black mb-6" style={{ color: 'var(--accent-color, #ffd624)' }}>{t('shippingTitle')}</h2>
          <div className="space-y-4 text-sm md:text-base leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            <p><strong style={{ color: 'var(--accent-color, #ffd624)' }}>{t('shippingCoverage').split(':')[0]}:</strong> {t('shippingCoverage').split(':')[1]}</p>
            <p><strong style={{ color: 'var(--accent-color, #ffd624)' }}>{t('shippingTimes')}</strong></p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t('shippingTime1')}</li>
              <li>{t('shippingTime2')}</li>
            </ul>
            <p><strong style={{ color: 'var(--accent-color, #ffd624)' }}>{t('shippingCosts').split(':')[0]}:</strong> {t('shippingCosts').split(':')[1]}</p>
            <p>{t('shippingText')}</p>
          </div>
        </section>

        {/* Política de Cambios y Devoluciones */}
        <section className="bg-black/40 backdrop-blur-md p-6 md:p-10 rounded-2xl transition-all duration-300 hover:bg-black/50 hover:scale-[1.01]">
          <h2 className="text-xl md:text-2xl font-black mb-6" style={{ color: 'var(--accent-color, #ffd624)' }}>{t('returnsTitle')}</h2>
          <div className="space-y-4 text-sm md:text-base leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            <p><strong style={{ color: 'var(--accent-color, #ffd624)' }}>{t('returnsDefective').split(':')[0]}:</strong> {t('returnsDefective').split(':')[1]}</p>
            <p><strong style={{ color: 'var(--accent-color, #ffd624)' }}>{t('returnsExchange').split(':')[0]}:</strong> {t('returnsExchange').split(':')[1]}</p>
            <p><strong style={{ color: 'var(--accent-color, #ffd624)' }}>{t('returnsProcess')}</strong></p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>{t('returnsStep1')}</li>
              <li>{t('returnsStep2')}</li>
              <li>{t('returnsStep3')}</li>
              <li>{t('returnsStep4')}</li>
            </ol>
          </div>
        </section>

        {/* Métodos de Pago */}
        <section className="bg-black/40 backdrop-blur-md p-6 md:p-10 rounded-2xl transition-all duration-300 hover:bg-black/50 hover:scale-[1.01]">
          <h2 className="text-xl md:text-2xl font-black mb-6" style={{ color: 'var(--accent-color, #ffd624)' }}>{t('paymentTitle')}</h2>
          <div className="space-y-4 text-sm md:text-base leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            <p>{t('paymentText')}</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t('paymentMethod1')}</li>
              <li>{t('paymentMethod2')}</li>
              <li>{t('paymentMethod3')}</li>
            </ul>
            <p>{t('paymentSecurity')}</p>
          </div>
        </section>

        {/* Protección de Datos */}
        <section className="bg-black/40 backdrop-blur-md p-6 md:p-10 rounded-2xl transition-all duration-300 hover:bg-black/50 hover:scale-[1.01]">
          <h2 className="text-xl md:text-2xl font-black mb-6" style={{ color: 'var(--accent-color, #ffd624)' }}>{t('dataTitle')}</h2>
          <div className="space-y-4 text-sm md:text-base leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            <p>{t('dataText')}</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t('dataUse1')}</li>
              <li>{t('dataUse2')}</li>
              <li>{t('dataUse3')}</li>
              <li>{t('dataUse4')}</li>
            </ul>
            <p>{t('dataRights')}</p>
          </div>
        </section>

        {/* Contacto */}
        <section className="bg-black/40 backdrop-blur-md p-6 md:p-10 rounded-2xl transition-all duration-300 hover:bg-black/50 hover:scale-[1.01]">
          <h2 className="text-xl md:text-2xl font-black mb-6" style={{ color: 'var(--accent-color, #ffd624)' }}>{t('contactTitle')}</h2>
          <div className="space-y-4 text-sm md:text-base leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            <p>{t('contactText')}</p>
            <p>
              <strong style={{ color: 'var(--accent-color, #ffd624)' }}>{t('contactEmail')}</strong><br />
              <strong style={{ color: 'var(--accent-color, #ffd624)' }}>{t('contactHours')}</strong>
            </p>
            <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)', marginTop: '2rem' }}>
              {t('lastUpdate')}
            </p>
          </div>
        </section>
      </main>

      <footer style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(10px)', paddingTop: '2rem', paddingBottom: '2rem', position: 'relative', zIndex: 10, marginTop: '4rem' }}>
        <div className="max-w-5xl mx-auto px-6 md:px-12 text-center">
          <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {t('footer')}
          </p>
        </div>
      </footer>
    </div>
  );
}
