'use client';
import { fetchStoreConfig } from '@/lib/store-config-cache';


import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CatalogoPage from './catalog/page';
import LoadingScreen from '@/components/LoadingScreen';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const checkStoreMode = () => {
    fetchStoreConfig()
      .then(data => data)
      .then(data => {
        const mode = data.config.mode;
        
        if (mode === 'soldout') {
          window.location.replace('/soldout');
        } else if (mode === 'password') {
          const userToken = sessionStorage.getItem('user_token');
          if (userToken) {
            fetch('/api/promo/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: userToken }),
            })
              .then(res => res.json())
              .then(data => {
                if (data.valid) {
                  setLoading(false);
                } else {
                  sessionStorage.removeItem('user_token');
                  window.location.replace('/password');
                }
              })
              .catch(() => window.location.replace('/password'));
          } else {
            window.location.replace('/password');
          }
        } else {
          setLoading(false);
        }
      })
      .catch(() => window.location.replace('/password'));
  };

  useEffect(() => {
    checkStoreMode();
  }, [router]);

  if (loading) {
    return <LoadingScreen />;
  }

  return <CatalogoPage />;
}
