'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'error', onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const colors = {
    error: { bg: 'rgba(220, 38, 38, 0.95)', border: '#ef4444' },
    success: { bg: 'rgba(34, 197, 94, 0.95)', border: '#22c55e' },
    info: { bg: 'rgba(59, 130, 246, 0.95)', border: '#3b82f6' }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '2rem',
        right: '2rem',
        zIndex: 99999,
        backgroundColor: colors[type].bg,
        color: '#ffffff',
        padding: '1rem 1.5rem',
        borderRadius: '12px',
        border: `2px solid ${colors[type].border}`,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        maxWidth: '400px',
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @media (max-width: 768px) {
          div {
            top: 1rem !important;
            right: 1rem !important;
            left: 1rem !important;
            max-width: calc(100vw - 2rem) !important;
          }
        }
      `}</style>
      <p style={{ flex: 1, margin: 0, fontSize: '0.875rem', fontWeight: '600' }}>{message}</p>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#ffffff',
          cursor: 'pointer',
          padding: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <X style={{ width: '18px', height: '18px' }} />
      </button>
    </div>
  );
}
