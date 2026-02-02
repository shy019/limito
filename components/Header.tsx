'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import Logo from './Logo';
import LanguageToggle from './LanguageToggle';

interface HeaderProps {
  locale: string;
  onLanguageToggle: () => void;
  cartCount?: number;
  showCart?: boolean;
}

export default function Header({ locale, onLanguageToggle, cartCount = 0, showCart = true }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 w-full" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)', paddingTop: '20px', zIndex: 100000 }}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between" style={{ marginLeft: '20px', marginRight: '20px' }}>
        <Logo size="md" href="/" />
        <div className="flex items-center" style={{ gap: '1rem' }}>
          {showCart && (
            <Link href="/cart" className="relative text-2xl rounded-full w-12 h-12 shadow-lg flex items-center justify-center hover:scale-110 transition-transform" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
              <ShoppingCart className="w-6 h-6" style={{ color: '#ffffff' }} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black" style={{ backgroundColor: '#ffd624', color: '#000000' }}>
                  {cartCount}
                </span>
              )}
            </Link>
          )}
          <LanguageToggle locale={locale} onToggle={onLanguageToggle} />
        </div>
      </div>
    </header>
  );
}
