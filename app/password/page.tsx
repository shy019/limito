'use client';

import { useState, useEffect, useRef } from 'react';
import { Instagram, Youtube, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import LoadingScreen from '@/components/LoadingScreen';
import Toast from '@/components/Toast';
import LanguageToggle from '@/components/LanguageToggle';
import AnimatedButton from '@/components/AnimatedButton';
import Input from '@/components/Input';
import PageContainer from '@/components/PageContainer';

const countries = [
  { name: 'Colombia', code: '57', flag: 'co' },
  { name: 'USA', code: '1', flag: 'us' },
  { name: 'México', code: '52', flag: 'mx' },
  { name: 'Argentina', code: '54', flag: 'ar' },
  { name: 'Brasil', code: '55', flag: 'br' },
  { name: 'Chile', code: '56', flag: 'cl' },
  { name: 'Perú', code: '51', flag: 'pe' },
  { name: 'Ecuador', code: '593', flag: 'ec' },
  { name: 'Venezuela', code: '58', flag: 've' },
  { name: 'Panamá', code: '507', flag: 'pa' },
  { name: 'Costa Rica', code: '506', flag: 'cr' },
  { name: 'El Salvador', code: '503', flag: 'sv' },
  { name: 'Guatemala', code: '502', flag: 'gt' },
  { name: 'Honduras', code: '504', flag: 'hn' },
  { name: 'Nicaragua', code: '505', flag: 'ni' },
  { name: 'Bolivia', code: '591', flag: 'bo' },
  { name: 'Paraguay', code: '595', flag: 'py' },
  { name: 'Uruguay', code: '598', flag: 'uy' }
];

export default function PasswordPage() {
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [submittingPhone, setSubmittingPhone] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [error, setError] = useState('');
  const [phoneSuccess, setPhoneSuccess] = useState(false);
  const [locale, setLocale] = useState('es');
  const [mounted, setMounted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);
  const t = useTranslations('home');

  useEffect(() => {
    if (checking) return;
    setChecking(true);
    setMounted(true);
    const cookies = document.cookie.split('; ');
    const localeCookie = cookies.find(c => c.startsWith('NEXT_LOCALE='));
    if (localeCookie) {
      setLocale(localeCookie.split('=')[1]);
    }

    // Check if user already has valid access token
    const accessCookie = cookies.find(c => c.startsWith('limito_access='));
    if (accessCookie) {
      window.location.replace('/catalog');
      return;
    }

    fetch('/api/store-config')
      .then(res => res.json())
      .then(data => {
        if (data.config.mode === 'soldout') {
          window.location.replace('/soldout');
        } else {
          setTimeout(() => setPageLoading(false), 100);
        }
      })
      .catch((err) => {
        console.error('Store config error:', err);
        setTimeout(() => setPageLoading(false), 100);
      });

    const handleClickOutside = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (pageLoading) return <LoadingScreen />;

  const hashPassword = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const encryptData = (text: string): string => {
    const key = Date.now().toString(36);
    const encoded = btoa(text);
    const mixed = encoded.split('').map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join('');
    return `${key}:${btoa(mixed)}`;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPassword(true);
    setError('');

    try {
      // Hash password before sending
      const hash = await hashPassword(password);

      const adminRes = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash }),
      });

      if (adminRes.ok) {
        const adminData = await adminRes.json();
        if (adminData.access) {
          window.location.href = '/admin';
          return;
        }
      }

      // For access codes, send encrypted (they need to be compared as-is on server)
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: encryptData(password) }),
      });

      const data = await res.json();

      if (data.access) {
        window.location.href = '/';
      } else {
        setError(t('password.errorIncorrect'));
        setPassword('');
      }
    } catch {
      setError(t('password.errorConnection'));
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPhone(true);

    const fullPhone = '+' + selectedCountry.code + phone;

    if (phone.length < 10) {
      setToast({ message: locale === 'es' ? 'Número inválido' : 'Invalid number', type: 'error' });
      setSubmittingPhone(false);
      return;
    }

    try {
      // Encrypt phone before sending
      const res = await fetch('/api/phones/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: encryptData(fullPhone) }),
      });

      if (res.ok) {
        setPhoneSuccess(true);
        setPhone('');
        setToast({ message: t('newsletter.success'), type: 'success' });
      } else {
        setToast({ message: t('newsletter.error'), type: 'error' });
      }
    } catch {
      setToast({ message: t('password.errorConnection'), type: 'error' });
    } finally {
      setSubmittingPhone(false);
    }
  };

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.includes(searchQuery)
  );

  return (
    <PageContainer>
      <style jsx global>{`
          .pn-select {
              position: relative;
              border: 1px solid #c3c3c3;
              display: grid;
              grid-template-columns: 4.5em 1fr;
              border-radius: 0.75em;
              box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);
              transition: all 0.2s ease-out;
              max-width: 20em;
              width: 100%;
              z-index: 1;
              height: 40px;
          }

          .pn-select--open {
              z-index: 99999;
          }

          .pn-select:focus-within {
              border-color: #0047a5;
              box-shadow: 0 0 2px 0 #0047a5;
          }

          .pn-select--open .pn-dropdown {
              pointer-events: all;
              opacity: 1;
              top: 120%;
              visibility: visible;
          }

          .pn-selected-prefix {
              align-items: center;
              appearance: none;
              background: #f3f5f9;
              border-radius: 0.75em 0 0 0.75em;
              border: 0;
              cursor: pointer;
              display: flex;
              justify-content: center;
              margin: 0;
              outline: none;
              padding: 0;
              transition: background 0.2s ease-out;
          }

          .pn-selected-prefix:hover {
              background: #e6eaf1;
          }

          .pn-selected-prefix__flag {
              height: auto;
              width: 1.25rem;
          }

          .pn-selected-prefix__icon {
              display: block;
              height: 1.25rem;
              margin-left: 0.5em;
              margin-right: -0.25em;
              transition: all 0.15s ease-out;
              width: 1.25rem;
          }

          .pn-select--open .pn-selected-prefix__icon {
              transform: rotate(180deg);
          }

          .pn-input {
              background: #ffffff;
              border-radius: 0 0.75em 0.75em 0;
              line-height: 1;
              overflow: hidden;
              padding: 0 1em;
          }

          .pn-input__label {
              color: #85898f;
              font-size: 0.5rem;
              position: relative;
              top: -0.1em;
          }

          .pn-input__container {
              display: flex;
              flex-direction: row;
          }

          .pn-input__prefix {
              background: transparent;
              position: absolute;
              color: #656b73;
              max-width: 3rem;
              pointer-events: none;
              border: 0;
              font-family: inherit;
              outline: none;
              margin: 0;
              padding: 0;
          }

          .pn-input__phonenumber {
              color: #081627;
              padding-left: calc(calc(${selectedCountry.code.length} * 1ch) + 1.5ch);
              font-weight: 500;
              font-size: 1rem;
              border: 0;
              font-family: inherit;
              outline: none;
              width: 100%;
          }

          .pn-dropdown {
              background: #ffffff;
              border-radius: 0.75em;
              border: 1px solid #eaeaec;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.135);
              opacity: 0;
              padding: 0 0.5em 0.5em;
              pointer-events: none;
              position: absolute;
              top: 140%;
              transition: all 0.15s ease-out;
              width: 94%;
              visibility: hidden;
              z-index: 100000;
          }

          .pn-search {
              position: relative;
              display: flex;
              border-bottom: 1px solid #eaeaec;
              margin-bottom: 0.5em;
          }

          .pn-search__icon {
              display: block;
              height: 1.25rem;
              left: 0.5em;
              pointer-events: none;
              position: absolute;
              top: 50%;
              transform: translateY(-50%);
              width: 1.25rem;
          }

          .pn-search__input {
              padding-left: 2.5rem;
              height: 1.8rem;
              width: 100%;
              font-size: 0.75rem;
              border: 0;
              font-family: inherit;
              outline: none;
          }

          .pn-list {
              max-height: 5.5em;
              overflow-y: auto;
              scrollbar-width: thin;
              scrollbar-color: #ffffff #ffffff;
          }

          .pn-list:hover {
              scrollbar-color: #c0c4ca #ffffff;
          }

          .pn-list-item {
              align-items: center;
              border-radius: 0.5em;
              display: flex;
              font-weight: 400;
              padding: 0.3em 0.75em;
              transition: background-color 0.2s ease-out;
              cursor: pointer;
              outline: none;
              font-size: 0.8rem;
          }

          .pn-list-item:hover {
              background-color: #f3f5f9;
          }

          .pn-list-item__flag {
              width: 1.25em;
              height: auto;
              margin-right: 1em;
              display: block;
          }

          .pn-list-item__country {
              margin-right: 0.25em;
          }

          .pn-list-item--selected {
              pointer-events: none;
              font-weight: 500;
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23103155' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E");
              background-position: right 0.75em top 50%;
              background-repeat: no-repeat;
              background-size: 1.25rem;
          }

          @keyframes opacity {
              0%, 100% {
                  opacity: 0;
              }
              50% {
                  opacity: 1;
              }
          }

          @keyframes change {
              0%, 50% {
                  transform: translate3d(0, 0, 0);
              }
              75%, 100% {
                  transform: translate3d(0, -100%, 0);
              }
          }

          .animate-fade-in {
              animation: fade-in 0.6s ease-out;
          }

          .animate-slide-up {
              animation: slide-up 0.6s ease-out;
              animation-fill-mode: both;
          }
      `}</style>

      {mounted && (
        <div className="fixed z-50" style={{ top: '20px', right: '20px', left: 'auto' }}>
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
        <div className="w-full space-y-2" style={{ maxWidth: '300px' }}>
          <div className="text-center space-y-2">
            <div className="animate-fade-in">
              <img src="/images/loading.png" alt="LIMITØ" style={{ height: '200px', width: 'auto', margin: '0 auto', display: 'block' }} />
            </div>
          </div>

          <div style={{ maxWidth: '300px', margin: '0 auto', animationDelay: '0.2s', position: 'relative', zIndex: isOpen ? 99999 : 'auto' }} className="animate-slide-up">
            <h2 className="text-lg font-black mb-5 text-center uppercase tracking-wide" style={{ color: '#ffffff' }}>
              {t('newsletter.title')}
            </h2>
            {phoneSuccess ? (
              <div className="text-center py-4">
                <p className="text-sm font-bold" style={{ color: '#16A34A' }}>
                  {t('newsletter.success')}
                </p>
              </div>
            ) : (
              <form onSubmit={handlePhoneSubmit}>
                <div className={`pn-select ${isOpen ? 'pn-select--open' : ''}`} ref={selectRef}>
                  <button
                    type="button"
                    className="pn-selected-prefix"
                    onClick={() => setIsOpen(!isOpen)}
                  >
                    <img
                      className="pn-selected-prefix__flag"
                      src={`https://flagpedia.net/data/flags/icon/36x27/${selectedCountry.flag}.png`}
                      alt={selectedCountry.name}
                    />
                    <svg className="pn-selected-prefix__icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#081626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <div className="pn-input">
                    <label className="pn-input__label">{locale === 'es' ? 'Teléfono*' : 'Phonenumber*'}</label>
                    <div className="pn-input__container">
                      <input className="pn-input__prefix" value={`+${selectedCountry.code}`} type="text" tabIndex={-1} readOnly />
                      <input
                        className="pn-input__phonenumber"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder=" "
                        required
                      />
                    </div>
                  </div>
                  <div className="pn-dropdown">
                    <div className="pn-search">
                      <svg className="pn-search__icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#103155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        placeholder="Search for countries"
                        className="pn-search__input"
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <ul className="pn-list">
                      {filteredCountries.map(country => (
                        <li
                          key={country.code}
                          className={`pn-list-item ${country.code === selectedCountry.code ? 'pn-list-item--selected' : ''}`}
                          onClick={() => {
                            setSelectedCountry(country);
                            setIsOpen(false);
                            setSearchQuery('');
                          }}
                        >
                          <img className="pn-list-item__flag" src={`https://flagpedia.net/data/flags/icon/36x27/${country.flag}.png`} alt={country.name} />
                          <span className="pn-list-item__country">{country.name}</span>
                          <span className="pn-list-item__prefix">(+{country.code})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <AnimatedButton
                    text={t('newsletter.button')}
                    disabled={submittingPhone}
                    loading={submittingPhone}
                    fullWidth
                    type="submit"
                  />
                </div>
              </form>
            )}
          </div>

          <div style={{ maxWidth: '300px', margin: '0 auto', animationDelay: '0.3s' }} className="animate-slide-up">
            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="w-full py-3 px-6 font-black uppercase tracking-wide transition-all hover:scale-105"
                style={{ backgroundColor: 'transparent', color: '#ffffff', border: 'none', borderBottom: '2px solid #ffffff' }}
              >
                {t('password.title')}
              </button>
            ) : (
              <>
                <h2 className="text-lg font-black mb-5 text-center uppercase tracking-wide" style={{ color: '#ffffff' }}>
                  {t('password.title')}
                </h2>
                <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <Input
                    type="password"
                    placeholder={t('password.placeholder')}
                    value={password}
                    onChange={setPassword}
                    required
                    error={!!error}
                  />
                  {error && (
                    <p style={{ fontSize: '12px', textAlign: 'center', fontWeight: 'bold', color: '#ff0000', marginTop: '8px', marginBottom: '8px' }} data-testid="error-message">
                      {error}
                    </p>
                  )}
                  <div style={{ marginTop: '8px' }}>
                    <AnimatedButton
                      text={t('password.button')}
                      disabled={submittingPassword}
                      fullWidth
                      type="submit"
                    />
                  </div>
                </form>
              </>
            )}
          </div>

          <div className="text-xs text-center space-x-4 pt-4 font-medium animate-slide-up" style={{ color: 'rgba(255, 255, 255, 0.7)', animationDelay: '0.35s', marginTop: '0.25rem' }}>
            <a href="/contact" className="transition-colors hover:text-white" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {t('footer.contact')}
            </a>
            <span>·</span>
            <a href="/policies" className="transition-colors hover:text-white" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {t('footer.policies')}
            </a>
          </div>

        </div>

        <div className="flex gap-8 justify-center animate-slide-up" style={{ animationDelay: '0.4s', position: 'absolute', bottom: '90px', left: '0', right: '0' }}>
            <a
              href="https://instagram.com/limito"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:scale-125 transition-all duration-300 drop-shadow-md hover:drop-shadow-xl"
              style={{ color: '#ffffff' }}
            >
              <Instagram className="w-7 h-7" strokeWidth={2.5} />
            </a>
            <span style={{ width: '20px' }}></span>
            <a
              href="https://youtube.com/@limito"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:scale-125 transition-all duration-300 drop-shadow-md hover:drop-shadow-xl"
              style={{ color: '#ffffff' }}
            >
              <Youtube className="w-7 h-7" strokeWidth={2.5} />
            </a>
            <span style={{ width: '20px' }}></span>
            <a
              href="https://tiktok.com/@limito"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:scale-125 transition-all duration-300 drop-shadow-md hover:drop-shadow-xl"
              style={{ color: '#ffffff' }}
            >
              <Send className="w-7 h-7" strokeWidth={2.5} />
            </a>
          </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </PageContainer>
  );
}
