'use client';
import { fetchStoreConfig } from '@/lib/store-config-cache';


import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import Toast from '@/components/Toast';
import LoadingScreen from '@/components/LoadingScreen';
import BackgroundOverlay from '@/components/BackgroundOverlay';

export default function ContactoPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [locale, setLocale] = useState('es');
  const [mounted, setMounted] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const t = useTranslations('contact');

  useEffect(() => {
    const isPublicPage = true; // Contact is always public

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
      .catch((err) => {
        console.error('Store config error:', err);
        setTimeout(() => setPageLoading(false), 100);
      });
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
        setToast({ message: t('success'), type: 'success' });
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setToast({ message: t('error'), type: 'error' });
      }
    } catch (error) {
      setToast({ message: t('error'), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <BackgroundOverlay />

      <div style={{ position: 'relative', zIndex: 10, flex: 1, marginLeft: '2rem', marginRight: '2rem' }}>
        <header className="sticky top-0 z-40" style={{ backgroundColor: 'transparent', marginTop: '20px' }}>
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-end">
            {mounted && (
              <button onClick={() => {
                const newLocale = locale === 'es' ? 'en' : 'es';
                document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
                window.location.reload();
              }} className="text-2xl rounded-full w-12 h-12 shadow-lg flex items-center justify-center hover:scale-110 transition-transform" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                {locale === 'es' ? '🇪🇸' : '🇺🇸'}
              </button>
            )}
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-6 py-12" style={{ paddingRight: '4rem' }}>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold hover:scale-105 transition-transform mb-8" style={{ color: '#ffd624' }}>
            <ArrowLeft className="w-4 h-4" />
            {t('back')}
          </Link>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-12">
            <div className="text-center mb-8" style={{ paddingLeft: '4rem' }}>
              <Mail className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4" style={{ color: '#ffd624' }} />
              <h1 className="text-3xl md:text-5xl font-black mb-2 md:mb-4" style={{ color: '#ffffff' }}>{t('title')}</h1>
              <p className="text-sm md:text-base" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{t('subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="input-container">
              <div className="row">
                <div className="col-xs-12">
                  <div className="styled-input wide">
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <label>{t('name')}</label>
                  </div>
                </div>
                <div className="col-md-6 col-sm-12">
                  <div className="styled-input">
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <label>{t('email')}</label>
                  </div>
                </div>
                <div className="col-md-6 col-sm-12">
                  <div className="styled-input" style={{ float: 'right' }}>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    />
                    <label>{t('subject')}</label>
                  </div>
                </div>
                <div className="col-xs-12">
                  <div className="styled-input wide">
                    <textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                    <label>{t('message')}</label>
                  </div>
                </div>
                <div className="col-xs-12" style={{ display: 'flex', justifyContent: 'center' }}>
                  <button type="submit" disabled={submitting} className="btn-lrg submit-btn">
                    {submitting ? t('sending') : t('send')}
                  </button>
                </div>
              </div>
            </form>

            <style jsx>{`
              .input-container {
                width: 650px;
                max-width: 100%;
                margin: 20px auto 25px auto;
              }
              .row {
                display: flex;
                flex-wrap: wrap;
                margin: 0 -15px;
              }
              .col-xs-12 {
                width: 100%;
                padding: 0 15px;
              }
              .col-md-6 {
                width: 50%;
                padding: 0 15px;
              }
              .col-sm-12 {
                width: 100%;
              }
              @media (max-width: 768px) {
                .col-md-6 {
                  width: 100%;
                }
              }
              .styled-input {
                float: left;
                width: 100%;
                margin: 1rem 0;
                position: relative;
                border-radius: 4px;
              }
              .styled-input.wide {
                width: 100%;
              }
              .styled-input label {
                color: #999;
                padding: 1.3rem 30px 1rem 30px;
                position: absolute;
                top: 10px;
                left: 0;
                transition: all 0.25s ease;
                pointer-events: none;
              }
              input:focus ~ label,
              textarea:focus ~ label,
              input:valid ~ label,
              textarea:valid ~ label {
                font-size: 0.75em;
                color: #999;
                top: -5px;
                transition: all 0.225s ease;
              }
              input,
              textarea {
                padding: 30px;
                border: 0;
                width: 100%;
                font-size: 1rem;
                background-color: #2d2d2d;
                color: white;
                border-radius: 4px;
              }
              input:focus,
              textarea:focus {
                outline: 0;
              }
              textarea {
                width: 100%;
                min-height: 15em;
              }
              .submit-btn {
                padding: 7px 35px;
                border-radius: 60px;
                display: inline-block;
                background-color: #ffd624;
                color: #000000;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                box-shadow: 0 2px 5px 0 rgba(0,0,0,0.06), 0 2px 10px 0 rgba(0,0,0,0.07);
                transition: all 300ms ease;
                border: none;
                margin-left: 15%;
              }
              .submit-btn:hover {
                transform: translateY(1px);
                box-shadow: 0 1px 1px 0 rgba(0,0,0,0.10), 0 1px 1px 0 rgba(0,0,0,0.09);
              }
              .submit-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
              }
              @media (max-width: 768px) {
                .submit-btn {
                  width: 100%;
                  float: none;
                  text-align: center;
                  margin-left: 30%;
                }
              }
            `}</style>

            <div className="mt-8 pt-8 border-t border-white/20 text-center" style={{ marginLeft: '4rem' }}>
              <p className="text-sm font-bold mb-2" style={{ color: '#ffffff' }}>{t('directEmail')}</p>
              <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hola@limito.co'}`} className="text-lg font-black hover:underline" style={{ color: '#ffd624' }}>
                {process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hola@limito.co'}
              </a>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
