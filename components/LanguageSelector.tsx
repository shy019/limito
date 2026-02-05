'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

function LanguageSelector() {
  const [locale, setLocale] = useState('es');

  useEffect(() => {
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1];
    
    if (cookieLocale) {
      setLocale(cookieLocale);
    }
  }, []);

  const toggleLocale = () => {
    const newLocale = locale === 'es' ? 'en' : 'es';
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <button
      onClick={toggleLocale}
      className="fixed bottom-6 right-6 z-[100] hover:scale-110 transition-all flex items-center justify-center gap-2 font-black uppercase"
      style={{
        backgroundColor: '#000000',
        color: 'var(--accent-color, #ffd624)',
        border: '2px solid var(--accent-color, #ffd624)',
        borderRadius: '12px',
        padding: '12px 20px',
        boxShadow: '0 4px 12px rgba(255, 214, 36, 0.3)',
        fontSize: '0.875rem',
        letterSpacing: '0.05em'
      }}
      title={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      <Globe className="w-5 h-5" />
      <span>{locale === 'es' ? 'EN' : 'ES'}</span>
    </button>
  );
}

export default LanguageSelector;
