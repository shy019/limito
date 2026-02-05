'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, Send } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const t = useTranslations('newsletter');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setMessage(t('subscribed'));
        setEmail('');
      } else {
        setMessage(t('error'));
      }
    } catch (error) {
      setMessage(t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-4">
        <Mail className="w-6 h-6" style={{ color: 'var(--accent-color, #ffd624)' }} />
        <h3 className="text-2xl font-black" style={{ color: '#ffffff' }}>{t('title')}</h3>
      </div>
      <p className="text-sm mb-6" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
        {t('subtitle')}
      </p>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('placeholder')}
          className="flex-1 px-4 py-3 rounded-xl focus:outline-none font-bold bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-white/50"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
          style={{ backgroundColor: '#5433EB', color: '#FFFFFF', fontWeight: 900 }}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
      
      {message && (
        <p className="text-sm mt-3 font-bold" style={{ color: message.includes(t('error')) ? '#ff0000' : '#16A34A' }}>
          {message}
        </p>
      )}
    </div>
  );
}
