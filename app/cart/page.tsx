'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Trash2, Plus, Minus, ShoppingBag, ChevronLeft, Truck } from 'lucide-react';
import { cart, type CartItem } from '@/lib/cart';
import { formatPrice } from '@/lib/products';
import type { ShippingZone } from '@/lib/shipping';
import { calculateShipping } from '@/lib/shipping';
import Toast from '@/components/Toast';
import SessionMonitor from '@/components/SessionMonitor';
import LoadingScreen from '@/components/LoadingScreen';
import Header from '@/components/Header';
import BackgroundOverlay from '@/components/BackgroundOverlay';
import { useStoreConfig } from '@/hooks/useStoreConfig';
import { useTokenRenewal } from '@/hooks/useTokenRenewal';
import { apiCache } from '@/lib/api-cache';

export default function CarritoPage() {
  const { config, loading: configLoading } = useStoreConfig();
  useTokenRenewal();
  const [items, setItems] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [city, setCity] = useState('Bogotá');
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [locale, setLocale] = useState('es');
  const [cartLoading, setCartLoading] = useState(true);
  const t = useTranslations('cart');

  const subtotal = cart.getTotal();
  const { cost: shippingCost, zone: shippingZone } = useMemo(() =>
    calculateShipping(city, subtotal),
    [city, subtotal]
  );

  useEffect(() => {
    if (config?.mode === 'soldout') {
      window.location.href = '/soldout';
      return;
    }

    setMounted(true);
    const cookies = document.cookie.split('; ');
    const localeCookie = cookies.find(c => c.startsWith('NEXT_LOCALE='));
    if (localeCookie) {
      setLocale(localeCookie.split('=')[1]);
    }

    // Usar apiCache para checkout
    apiCache.fetch<{ zones: ShippingZone[] }>('/api/checkout', undefined, 300000)
      .then(data => {
        if (data.zones) {
          setShippingZones(data.zones);
        }
      })
      .catch(() => {});
  }, [config]);

  useEffect(() => {
    const syncCart = async () => {
      const synced = await cart.sync();
      setItems(synced);
      setCartLoading(false);
    };

    syncCart();

    const handleUpdate = () => setItems(cart.get());
    window.addEventListener('cart-updated', handleUpdate);

    return () => {
      window.removeEventListener('cart-updated', handleUpdate);
    };
  }, []);


  const handleApplyPromo = async () => {
    setPromoError('');
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode }),
      });
      const data = await res.json();
      if (data.valid) {
        const discountAmount = data.type === 'percentage' ? (subtotal * data.value) / 100 : data.value;
        setDiscount(discountAmount);
        setPromoApplied(true);
      } else {
        setPromoError(data.error);
      }
    } catch {
      setPromoError(t('errors.applyCodeError'));
    }
  };

  const encryptData = (text: string): string => {
    const key = Date.now().toString(36);
    const encoded = btoa(text);
    const mixed = encoded.split('').map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join('');
    return `${key}:${btoa(mixed)}`;
  };

  const handleCheckout = async () => {
    if (!customerEmail || !customerName || !customerPhone) {
      setToast({ message: 'Completa tus datos', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const sessionId = cart.getSessionId();
      const cartItems = cart.get();

      const res = await fetch('/api/checkout/payu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          customerEmail: encryptData(customerEmail),
          customerName: encryptData(customerName),
          customerPhone: encryptData(customerPhone),
          items: cartItems,
          subtotal,
          shippingCost,
          discount,
          total,
          shippingAddress: { city },
        }),
      });

      const data = await res.json();

      if (data.success && data.payuData) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://checkout.payulatam.com/ppp-web-gateway-payu/';

        Object.entries(data.payuData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } else {
        setToast({ message: t('errors.processPaymentError'), type: 'error' });
        setSubmitting(false);
      }
    } catch {
      setToast({ message: t('home.password.errorConnection'), type: 'error' });
      setSubmitting(false);
    }
  };

  const total = subtotal + shippingCost - discount;

  if (configLoading || cartLoading) return <LoadingScreen />;

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <BackgroundOverlay />
        <header className="sticky top-0 z-40" style={{ backgroundColor: 'transparent', marginTop: '20px' }}>
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-end" style={{ marginLeft: '20px', marginRight: '20px' }}>
            {mounted && (
              <button onClick={() => {
                const newLocale = locale === 'es' ? 'en' : 'es';
                document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
                window.location.reload();
              }} className="text-2xl rounded-full w-12 h-12 shadow-lg flex items-center justify-center hover:scale-110 transition-transform" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                {locale === 'es' ? '🇪🇸' : '🇺🇸'}
              </button>
            )}
          </div>
        </header>
        <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="text-center space-y-8">
            <ShoppingBag className="w-24 h-24 mx-auto" style={{ color: 'var(--accent-color, #ffd624)' }} />
            <h1 className="text-6xl font-black" style={{ color: '#ffffff' }}>{t('empty')}</h1>
            <Link href="/" className="inline-block px-8 uppercase tracking-wider transition-all relative overflow-hidden group" style={{ backgroundColor: '#5433EB', color: '#FFFFFF', fontSize: '1rem', height: '56px', lineHeight: '56px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(84, 51, 235, 0.3)', fontFamily: 'inherit', fontWeight: 900, letterSpacing: '0.05em' }}>
              <span className="relative z-10">{t('continueShopping')}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <BackgroundOverlay />
      <div style={{ position: 'relative', zIndex: 10, flex: 1 }}>
        <Header
          locale={locale}
          onLanguageToggle={() => {
            const newLocale = locale === 'es' ? 'en' : 'es';
            document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
            window.location.reload();
          }}
          showCart={false}
        />
        <div className="max-w-6xl mx-auto px-6 py-12 cart-container">
          <style jsx>{`
            .cart-container {
              padding-left: 2rem;
              padding-right: 2rem;
              padding-top: 3rem;
              padding-bottom: 3rem;
            }
            .cart-item {
              padding: 2rem;
            }
            .cart-item-content {
              gap: 2rem;
            }
            .back-button {
              top: 75px;
            }
            @media (max-width: 768px) {
              .cart-container {
                padding-left: 1rem !important;
                padding-right: 1rem !important;
                padding-top: 2rem !important;
                margin-top: 20px !important;
              }
              .cart-item {
                padding: 1rem !important;
              }
              .cart-item-content {
                flex-direction: column !important;
                gap: 1rem !important;
              }
              .back-button {
                top: 75px !important;
              }
            }
          `}</style>
          <button onClick={() => window.location.href = '/catalog'} className="fixed hover:bg-white rounded-full z-50 back-button" style={{ padding: '0.5rem', left: '1.5rem', color: '#000000', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
            <ChevronLeft className="w-6 h-6" />
          </button>

          <h1 className="text-6xl font-black mb-4 text-center" style={{ color: '#ffffff' }}>{t('title')}</h1>

          <div className="flex justify-end" style={{ marginBottom: '1rem' }}>
            <button
              onClick={() => setShowClearModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all hover:scale-105"
              style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', color: '#ff0000', border: '1px solid rgba(255, 0, 0, 0.3)' }}
            >
              <Trash2 className="w-4 h-4" />
              {t('clearCart')}
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="md:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map((item) => (
                <div key={item.productId} className="rounded-2xl transition-all cart-item" style={{ backgroundColor: 'rgba(20, 20, 20, 0.9)' }}>
                  <div className="flex gap-6 cart-item-content">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-2xl font-black" style={{ color: '#ffffff' }}>{item.name}</h3>
                        <button onClick={() => cart.remove(item.productId)} className="hover:scale-110 transition-all" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                          <Trash2 className="w-4 h-4" style={{ color: '#ff0000' }} />
                        </button>
                      </div>
                      <p className="text-3xl font-black" style={{ color: 'var(--accent-color, #ffd624)', marginTop: '-4px' }}>{formatPrice(item.price)}</p>
                    </div>

                    <div className="flex flex-col items-end justify-end">
                      <div className="flex items-center" style={{ gap: '0.5rem' }}>
                        <button onClick={async () => {
                          if (item.quantity === 1) {
                            await cart.remove(item.productId);
                          } else {
                            await cart.updateQuantity(item.productId, item.quantity - 1);
                          }
                        }} className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:scale-105" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                          <Minus className="w-3.5 h-3.5" style={{ color: '#ffffff' }} />
                        </button>
                        <span className="w-8 text-center font-black text-xl" style={{ color: 'var(--accent-color, #ffd624)' }}>{item.quantity}</span>
                        <button
                          onClick={async () => {
                            const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
                            if (totalItems >= 5) {
                              setToast({ message: t('maxTotal'), type: 'error' });
                              return;
                            }
                            await cart.updateQuantity(item.productId, item.quantity + 1);
                          }}
                          disabled={item.quantity >= 5 || items.reduce((sum, i) => sum + i.quantity, 0) >= 5}
                          className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{ backgroundColor: 'var(--accent-color, #ffd624)', color: '#000000' }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="md:col-span-1">
              <div className="bg-white/10 backdrop-blur-md p-10 rounded-2xl sticky top-6" style={{ border: 'none' }}>
                <h2 className="text-3xl font-black mb-6" style={{ color: '#ffffff' }}>{t('summary')}</h2>

                <div className="mb-6">
                  <label className="block text-xs font-bold mb-2" style={{ color: '#ffffff' }}>
                    <Truck className="w-4 h-4 inline mr-1" />
                    {t('shippingCity')}
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none font-black bg-white/20 backdrop-blur-md border border-white/30 text-white"
                    style={{ fontSize: '1rem', boxSizing: 'border-box' }}
                  >
                    {shippingZones.map(zone => (
                      <option key={zone.id} value={zone.name} style={{ backgroundColor: '#000', color: '#fff' }}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                  {shippingZone && (
                    <p className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {locale === 'es' ? shippingZone.deliveryDays : shippingZone.deliveryDaysEn}
                      {shippingCost === 0 && ` • ${t('free')} ${t('shipping')}`}
                    </p>
                  )}
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#ffffff' }}>{t('subtotal')}</span>
                    <span className="font-bold" style={{ color: 'var(--accent-color, #ffd624)' }}>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#ffffff' }}>{t('shipping')}</span>
                    <span className="font-bold" style={{ color: shippingCost === 0 ? '#16A34A' : 'var(--accent-color, #ffd624)' }}>
                      {shippingCost === 0 ? t('free') : formatPrice(shippingCost)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#16A34A' }}>{t('discount')}</span>
                      <span className="font-bold" style={{ color: '#16A34A' }}>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="border-t-2 pt-4" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                    <div className="flex justify-between text-lg">
                      <span className="font-black" style={{ color: '#ffffff' }}>{t('total')}</span>
                      <span className="font-black text-3xl" style={{ color: 'var(--accent-color, #ffd624)' }}>{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                {!promoApplied && (
                  <div className="mb-6">
                    <label className="block text-xs font-bold mb-2" style={{ color: '#ffffff' }}>{t('promoCode')}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="CODE"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        className="flex-1 px-4 py-3 rounded-xl focus:outline-none font-black bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-white/50"
                        style={{ fontSize: '1rem', boxSizing: 'border-box', minWidth: 0 }}
                      />
                      <button
                        onClick={handleApplyPromo}
                        className="px-6 py-3 uppercase transition-all relative overflow-hidden group"
                        style={{ backgroundColor: '#000000', color: '#ffffff', fontSize: '1rem', border: '2px solid var(--accent-color, #ffd624)', borderRadius: '12px', boxShadow: '0 2px 8px rgba(var(--accent-color-rgb, 255, 214, 36), 0.2)', fontFamily: 'inherit', fontWeight: 900, letterSpacing: '0.05em' }}
                      >
                        <span className="relative z-10">{t('apply')}</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      </button>
                    </div>
                    {promoError && <p className="text-xs mt-2 font-bold" style={{ color: '#ff0000' }}>{promoError}</p>}
                  </div>
                )}

                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-2" style={{ color: '#ffffff' }}>Email</label>
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none font-black bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-white/50"
                      style={{ fontSize: '1rem', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2" style={{ color: '#ffffff' }}>Nombre Completo</label>
                    <input
                      type="text"
                      placeholder="Tu Nombre"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none font-black bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-white/50"
                      style={{ fontSize: '1rem', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2" style={{ color: '#ffffff' }}>Teléfono</label>
                    <input
                      type="tel"
                      placeholder="3001234567"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none font-black bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-white/50"
                      style={{ fontSize: '1rem', boxSizing: 'border-box' }}
                      maxLength={10}
                      required
                    />
                  </div>
                </div>

                <button onClick={handleCheckout} disabled={submitting} className="w-full uppercase tracking-wider transition-all disabled:opacity-50 mb-6 relative overflow-hidden group" style={{ backgroundColor: 'var(--accent-color, #D4AF37)', color: '#000000', fontSize: '1rem', height: '56px', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)', fontFamily: 'inherit', fontWeight: 900, letterSpacing: '0.05em', marginTop: '10px' }}>
                  <span className="relative z-10">{submitting ? t('processing') : t('checkout')}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>

                <Link href="/" className="block text-center font-black hover:underline" style={{ color: '#ffffff', fontSize: '1rem' }}>
                  {t('continueShopping')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <SessionMonitor />

      {/* Modal de confirmación */}
      {mounted && showClearModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#000000', borderRadius: '16px', padding: '2rem', maxWidth: '28rem', margin: '0 1rem', border: '2px solid var(--accent-color, #ffd624)', boxShadow: '0 20px 60px rgba(var(--accent-color-rgb, 255, 214, 36), 0.3)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem', color: '#ffffff' }}>{t('clearConfirm')}</h3>
            <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>{t('clearMessage')}</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowClearModal(false)}
                style={{ flex: 1, padding: '0.75rem', fontWeight: 900, textTransform: 'uppercase', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', fontSize: '1rem', border: '2px solid rgba(255, 255, 255, 0.3)', cursor: 'pointer' }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  cart.clear();
                  setShowClearModal(false);
                }}
                style={{ flex: 1, padding: '0.75rem', fontWeight: 900, textTransform: 'uppercase', borderRadius: '12px', backgroundColor: 'var(--accent-color, #ffd624)', color: '#000000', fontSize: '1rem', border: 'none', cursor: 'pointer' }}
              >
                {t('clear')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
