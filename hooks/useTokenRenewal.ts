import { useEffect } from 'react';

export function useTokenRenewal() {
  useEffect(() => {
    const renewToken = async () => {
      try {
        await fetch('/api/access/renew', { method: 'POST' });
      } catch (err) {
        // ignore renewal errors
      }
    };

    // Renovar inmediatamente y luego cada 5 minutos
    renewToken();
    const interval = setInterval(renewToken, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}
