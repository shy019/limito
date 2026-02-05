import { useEffect } from 'react';

export function useTokenRenewal() {
  useEffect(() => {
    const renewToken = async () => {
      try {
        await fetch('/api/access/renew', { method: 'POST' });
      } catch (err) {
        console.error('Token renewal error:', err);
      }
    };

    // Renovar cada 5 minutos
    const interval = setInterval(renewToken, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}
