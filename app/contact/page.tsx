'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import Toast from '@/components/Toast';
import LoadingScreen from '@/components/LoadingScreen';
import LanguageToggle from '@/components/LanguageToggle';
import AnimatedButton from '@/components/AnimatedButton';
import PageContainer from '@/components/PageContainer';

export default function ContactoPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [locale, setLocale] = useState('es');
  const [mounted, setMounted] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const t = useTranslations('contact');

  useEffect(() => {
    setMounted(true);
    const cookies = document.cookie.split('; ');
    const localeCookie = cookies.find(c => c.startsWith('NEXT_LOCALE='));
    if (localeCookie) setLocale(localeCookie.split('=')[1]);
    setTimeout(() => setPageLoading(false), 100);
  }, []);

  if (pageLoading) return <LoadingScreen />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSuccess(true);
        setToast({ message: t('success'), type: 'success' });
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setToast({ message: t('error'), type: 'error' });
      }
    } catch {
      setToast({ message: t('error'), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <style jsx global>{`
        .animate-slide-up { animation: slide-up 0.6s ease-out; animation-fill-mode: both; }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .contact-input { width: 100%; padding: 12px 16px; background-color: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 0.75rem; color: #fff; font-size: 0.875rem; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
        .contact-input:focus { border-color: var(--accent-color, #ffd624); }
        .contact-input::placeholder { color: rgba(255,255,255,0.4); }
        .contact-textarea { min-height: 120px; resize: vertical; }
      `}</style>

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

      <div className="fixed z-50" style={{ top: '24px', left: '20px' }}>
        <button onClick={() => window.history.back()} className="rounded-full w-10 h-10 flex items-center justify-center hover:scale-110 transition-transform" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
          <ChevronLeft className="w-5 h-5" style={{ color: '#fff' }} />
        </button>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full" style={{ maxWidth: '340px' }}>

          <div style={{ textAlign: 'center', marginBottom: '20px' }} className="animate-slide-up">
            <Image src="/images/logo.png" alt="Logo" width={200} height={49} style={{ margin: '0 auto', width: '200px', height: 'auto' }} priority unoptimized />
          </div>

          <div className="animate-slide-up" style={{ textAlign: 'center', marginBottom: '20px', animationDelay: '0.1s' }}>
            <h1 className="text-2xl font-black uppercase" style={{ color: '#ffffff', marginBottom: '6px' }}>{t('title')}</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('subtitle')}</p>
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {success ? (
              <div className="text-center py-6">
                <p className="text-sm font-bold" style={{ color: '#16A34A' }}>{t('success')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input className="contact-input" type="text" placeholder={t('namePlaceholder')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                <input className="contact-input" type="email" placeholder={t('emailPlaceholder')} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                <input className="contact-input" type="text" placeholder={t('subjectPlaceholder')} value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
                <textarea className="contact-input contact-textarea" placeholder={t('messagePlaceholder')} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required />
                <div style={{ marginTop: '4px' }}>
                  <AnimatedButton text={t('send')} disabled={submitting} loading={submitting} fullWidth type="submit" />
                </div>
              </form>
            )}
          </div>

          <div className="animate-slide-up" style={{ textAlign: 'center', marginTop: '20px', animationDelay: '0.3s' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>{t('directEmail')}</p>
            <a href="mailto:limitohats@gmail.com" className="text-sm font-bold hover:underline" style={{ color: 'var(--accent-color, #ffd624)' }}>
              limitohats@gmail.com
            </a>
          </div>

          <div className="flex justify-center animate-slide-up" style={{ animationDelay: '0.35s', marginTop: '1.2rem', gap: '0.7rem' }}>
            <a href="https://tiktok.com/@limitohats" target="_blank" rel="noopener noreferrer" className="hover:scale-125 transition-all duration-300" style={{ color: '#ffffff' }}>
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
            </a>
            <a href="https://instagram.com/limitohats" target="_blank" rel="noopener noreferrer" className="hover:scale-125 transition-all duration-300" style={{ color: '#ffffff' }}>
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
          </div>

        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </PageContainer>
  );
}
