'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cart } from '@/lib/cart';
import LanguageSelector from '@/components/LanguageSelector';

export default function SuccessPage() {
  const t = useTranslations('success');
  
  useEffect(() => {
    cart.clear();
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-12 max-w-2xl text-center shadow-2xl">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl font-black mb-4">{t('title')}</h1>
        <p className="text-xl text-gray-600 mb-8">
          {t('message')}
        </p>
        <Link
          href="/"
          className="inline-block bg-black text-white px-8 py-4 rounded-xl font-black uppercase tracking-wider hover:bg-gray-800 transition-colors"
        >
          {t('backToCatalog')}
        </Link>
      </div>
      <LanguageSelector />
    </div>
  );
}
