'use client';

import { useState, useEffect } from 'react';
import { Instagram, Youtube, Send, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { getCurrentMode } from '@/lib/store-config';
import LoadingScreen from '@/components/LoadingScreen';
import Toast from '@/components/Toast';
import Logo from '@/components/Logo';
import LanguageToggle from '@/components/LanguageToggle';
import BackgroundOverlay from '@/components/BackgroundOverlay';

export default function SoldOutPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [locale, setLocale] = useState('es');
  const [pageLoading, setPageLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);
  const router = useRouter();
  const t = useTranslations('home');

  useEffect(() => {
    setMounted(true);
    const cookies = document.cookie.split('; ');
    const localeCookie = cookies.find(c => c.startsWith('NEXT_LOCALE='));
    if (localeCookie) {
      setLocale(localeCookie.split('=')[1]);
    }
    setTimeout(() => setPageLoading(false), 100);
  }, []);

  if (pageLoading) return <LoadingScreen />;

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSuccess(true);
        setEmail('');
        setToast({ message: locale === 'es' ? '¡Gracias! Te avisaremos pronto' : 'Thanks! We\'ll notify you soon', type: 'success' });
      } else {
        setToast({ message: t('newsletter.error'), type: 'error' });
      }
    } catch (err) {
      console.error('Newsletter error:', err);
      setToast({ message: t('home.password.errorConnection'), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ color: 'white' }}>
      <BackgroundOverlay />

      {mounted && (
        <div className="fixed z-50" style={{ top: '20px', right: '20px' }}>
          <LanguageToggle 
            locale={locale}
            onToggle={() => {
              const newLocale = locale === 'es' ? 'en' : 'es';
              document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
              window.location.reload();
            }}
          />
        </div>
      )}

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-12 text-center">
          
          <div className="space-y-8">
            <Logo size="xl" />
            
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
                {locale === 'es' ? '¡Todo Agotado!' : 'Sold Out!'}
              </h2>
              <p className="text-xl md:text-2xl text-white font-medium max-w-xl mx-auto leading-relaxed">
                {locale === 'es' ? 'Gracias por tu interés. Nuestro drop actual se agotó completamente.' : 'Thanks for your interest. Our current drop is completely sold out.'}
              </p>
            </div>

            <div className="inline-block bg-[#ffd624] text-black px-8 py-4 rounded-full shadow-2xl">
              <p className="text-sm uppercase tracking-[0.3em] font-bold">
                {locale === 'es' ? 'Próximo Drop' : 'Next Drop'}
              </p>
              <p className="text-3xl font-black mt-1">
                {locale === 'es' ? 'Muy Pronto' : 'Coming Soon'}
              </p>
            </div>
          </div>

          {/* Newsletter Card */}
          <div className="bg-black/40 backdrop-blur-md p-10 rounded-2xl shadow-2xl">
            <h3 className="text-2xl font-black mb-3 text-white uppercase tracking-wide">
              {locale === 'es' ? 'Sé el Primero en Enterarte' : 'Be the First to Know'}
            </h3>
            <p className="text-gray-300 mb-6 text-sm">
              {locale === 'es' ? 'Únete a nuestro newsletter y recibe acceso anticipado al próximo drop' : 'Join our newsletter and get early access to the next drop'}
            </p>
            
            {success ? (
              <div className="py-8">
                <div className="inline-block bg-[#16A34A] text-white px-6 py-3 rounded-full">
                  <p className="font-bold">{locale === 'es' ? '¡Gracias! Te avisaremos pronto 🎉' : 'Thanks! We\'ll notify you soon 🎉'}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder={locale === 'es' ? 'tu@email.com' : 'your@email.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-6 py-5 text-base border-2 border-white/20 rounded-xl focus:outline-none focus:border-white bg-white/10 text-white placeholder-gray-400 transition-all font-medium"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#ffd624] text-black py-5 text-base font-black uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 hover:bg-[#ffed4e] hover:shadow-2xl hover:scale-105 active:scale-95"
                >
                  GET ACCESS
                </button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <p className="text-gray-300 text-sm">
              {locale === 'es' ? '¿Tienes preguntas? Escríbenos a' : 'Have questions? Write to us at'}{' '}
              <a href="mailto:hola@limito.co" className="text-[#ffd624] hover:underline font-bold">
                hola@limito.co
              </a>
            </p>

            {/* Social Links */}
            <div className="flex gap-8 justify-center">
              <a
                href="https://instagram.com/limito"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-[#ffd624] hover:scale-125 transition-all"
              >
                <Instagram className="w-8 h-8" strokeWidth={2.5} />
              </a>
              <a
                href="https://youtube.com/@limito"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-[#ffd624] hover:scale-125 transition-all"
              >
                <Youtube className="w-8 h-8" strokeWidth={2.5} />
              </a>
              <a
                href="https://tiktok.com/@limito"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-[#ffd624] hover:scale-125 transition-all"
              >
                <Send className="w-8 h-8" strokeWidth={2.5} />
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="text-xs space-x-4 text-gray-400 font-medium">
            <a href="/contact" className="hover:text-white transition-colors">
              {locale === 'es' ? 'Contacto' : 'Contact'}
            </a>
            <span>·</span>
            <a href="/policies" className="hover:text-white transition-colors">
              {locale === 'es' ? 'Políticas' : 'Policies'}
            </a>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
