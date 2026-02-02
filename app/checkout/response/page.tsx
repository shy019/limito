'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';
import { cart } from '@/lib/cart';

export default function PayUResponsePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('checkout.response');
  const [status, setStatus] = useState<'loading' | 'approved' | 'pending' | 'declined' | 'error'>('loading');

  useEffect(() => {
    const state = searchParams.get('transactionState');
    
    if (state === '4') {
      setStatus('approved');
      cart.clear();
    } else if (state === '7') {
      setStatus('pending');
    } else if (state === '6') {
      setStatus('declined');
    } else {
      setStatus('error');
    }
  }, [searchParams]);

  if (status === 'loading') return <LoadingScreen />;

  const statusConfig = {
    approved: {
      icon: CheckCircle,
      color: '#16A34A',
      title: t('approved.title'),
      message: t('approved.message'),
      buttonText: t('approved.button'),
      buttonAction: () => router.push('/'),
    },
    pending: {
      icon: Clock,
      color: '#ffd624',
      title: t('pending.title'),
      message: t('pending.message'),
      buttonText: t('pending.button'),
      buttonAction: () => router.push('/'),
    },
    declined: {
      icon: XCircle,
      color: '#DC2626',
      title: t('declined.title'),
      message: t('declined.message'),
      buttonText: t('declined.button'),
      buttonAction: () => router.push('/cart'),
    },
    error: {
      icon: AlertCircle,
      color: '#DC2626',
      title: t('error.title'),
      message: t('error.message'),
      buttonText: t('error.button'),
      buttonAction: () => router.push('/cart'),
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0A0A' }}>
      <div style={{ textAlign: 'center', maxWidth: '500px', padding: '3rem' }}>
        <Icon className="w-24 h-24 mx-auto mb-6" style={{ color: config.color }} />
        <h1 className="text-5xl font-black mb-4" style={{ color: '#ffffff' }}>{config.title}</h1>
        <p className="text-lg mb-8" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{config.message}</p>
        <button
          onClick={config.buttonAction}
          className="px-8 py-4 uppercase tracking-wider transition-all relative overflow-hidden group"
          style={{ backgroundColor: '#5433EB', color: '#FFFFFF', fontSize: '1rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(84, 51, 235, 0.3)', fontFamily: 'inherit', fontWeight: 900, letterSpacing: '0.05em', border: 'none' }}
        >
          <span className="relative z-10">{config.buttonText}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        </button>
      </div>
    </div>
  );
}
