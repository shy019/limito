'use client';

import { Clock } from 'lucide-react';
import Link from 'next/link';

export default function PendingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0A0A' }}>
      <div style={{ textAlign: 'center', maxWidth: '500px', padding: '3rem' }}>
        <Clock className="w-24 h-24 mx-auto mb-6" style={{ color: '#ffd624' }} />
        <h1 className="text-5xl font-black mb-4" style={{ color: '#ffffff' }}>Pago Pendiente</h1>
        <p className="text-lg mb-8" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Tu pago está siendo procesado. Te notificaremos por email cuando se confirme.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-4 uppercase tracking-wider transition-all relative overflow-hidden group"
          style={{ backgroundColor: '#5433EB', color: '#FFFFFF', fontSize: '1rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(84, 51, 235, 0.3)', fontFamily: 'inherit', fontWeight: 900, letterSpacing: '0.05em' }}
        >
          <span className="relative z-10">Volver al Inicio</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        </Link>
      </div>
    </div>
  );
}
