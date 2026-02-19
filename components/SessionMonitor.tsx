'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const SESSION_DURATION = 5 * 60 * 1000; // 5 minutes
const SESSION_TIMESTAMP_KEY = 'limito_session_timestamp';

export default function SessionMonitor() {
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds
  const [showWarning, setShowWarning] = useState(false);
  const router = useRouter();

  // Refresh session timestamp on any user interaction
  useEffect(() => {
    const refresh = () => {
      sessionStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
    };

    const events = ['click', 'scroll', 'keydown', 'touchstart'];
    events.forEach(e => window.addEventListener(e, refresh, { passive: true }));
    return () => events.forEach(e => window.removeEventListener(e, refresh));
  }, []);

  useEffect(() => {
    const checkSession = () => {
      const timestamp = sessionStorage.getItem(SESSION_TIMESTAMP_KEY);
      if (!timestamp) {
        handleSessionExpired();
        return;
      }

      const elapsed = Date.now() - parseInt(timestamp, 10);
      const remaining = SESSION_DURATION - elapsed;

      if (remaining <= 0) {
        handleSessionExpired();
        return;
      }

      const secondsLeft = Math.floor(remaining / 1000);
      setTimeLeft(secondsLeft);

      // Show warning when less than 1 minute left
      if (secondsLeft <= 60 && !showWarning) {
        setShowWarning(true);
      }
    };

    const handleSessionExpired = () => {
      // Clear everything
      sessionStorage.clear();
      localStorage.removeItem('limito_cart');
      
      // Clear cookies
      document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        if (name.startsWith('limito_') || name === 'user_token') {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });

      // Redirect to password page
      router.push('/password');
    };

    // Check every second
    const interval = setInterval(checkSession, 1000);
    checkSession(); // Initial check

    return () => clearInterval(interval);
  }, [router, showWarning]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't show anything if more than 1 minute left
  if (timeLeft > 60) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: timeLeft <= 30 ? 'rgba(220, 38, 38, 0.95)' : 'rgba(234, 179, 8, 0.95)',
        color: '#ffffff',
        padding: '12px 20px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        zIndex: 999999,
        fontSize: '14px',
        fontWeight: 'bold',
        animation: timeLeft <= 30 ? 'pulse 1s infinite' : 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>Sesión expira en: {formatTime(timeLeft)}</span>
      </div>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
