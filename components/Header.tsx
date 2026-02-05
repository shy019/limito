'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import LanguageToggle from './LanguageToggle';

interface HeaderProps {
  locale: string;
  onLanguageToggle: () => void;
  cartCount?: number;
  showCart?: boolean;
}

export default function Header({ locale, onLanguageToggle, cartCount = 0, showCart = true }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 w-full" style={{ paddingTop: '20px', zIndex: 100000 }}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between" style={{ marginLeft: '20px', marginRight: '20px', position: 'relative' }}>
        <div className="flex items-center">
          {showCart && (
            <Link href="/cart" className="relative rounded-full w-12 h-12 shadow-lg flex items-center justify-center hover:scale-110 transition-transform" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
              <ShoppingCart className="w-6 h-6 pointer-events-none" style={{ color: '#ffffff' }} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black pointer-events-none" style={{ backgroundColor: 'var(--accent-color, var(--accent-color, #D4AF37))', color: '#000000' }}>
                  {cartCount}
                </span>
              )}
            </Link>
          )}
        </div>
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', marginTop: '5px' }}>
          <img 
            src="/images/logo.png" 
            alt="Logo" 
            style={{ 
              height: window.innerWidth >= 1024 ? '50px' : window.innerWidth >= 768 ? '40px' : '30px', 
              width: 'auto' 
            }} 
          />
        </div>
        <div className="flex items-center">
          <LanguageToggle locale={locale} onToggle={onLanguageToggle} />
        </div>
      </div>
    </header>
  );
}
