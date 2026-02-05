'use client';

import Image from 'next/image';
import { useState, memo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronLeft, Check, Minus, Plus } from 'lucide-react';
import { formatPrice, type Product } from '@/lib/products';
import { cart } from '@/lib/cart';
import LoadingScreen from '@/components/LoadingScreen';
import Toast from '@/components/Toast';
import Header from '@/components/Header';
import ResponsiveProductImage from '@/components/ResponsiveProductImage';
import AnimatedButton from '@/components/AnimatedButton';
import BackgroundOverlay from '@/components/BackgroundOverlay';
import SessionMonitor from '@/components/SessionMonitor';
import { useProducts } from '@/hooks/useProducts';
import { useStoreConfig } from '@/hooks/useStoreConfig';
import { useAvailableStock } from '@/hooks/useAvailableStock';
import { useTokenRenewal } from '@/hooks/useTokenRenewal';

export default function CatalogoPage() {
  const { products, loading: productsLoading, loadProducts } = useProducts();
  const { config, loading: configLoading } = useStoreConfig();
  useTokenRenewal();
  const [locale, setLocale] = useState('es');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);
  const t = useTranslations('catalog');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (config?.mode === 'soldout') {
      window.location.href = '/soldout';
      return;
    }

    if (typeof document !== 'undefined') {
      const cookieLocale = document.cookie.split('; ').find(row => row.startsWith('NEXT_LOCALE='))?.split('=')[1] || 'es';
      setLocale(cookieLocale);
    }
    setCartCount(cart.getCount());

    const handleCartUpdate = () => {
      setCartCount(cart.getCount());
      // NO recargar productos, solo actualizar contador
    };
    window.addEventListener('cart-updated', handleCartUpdate);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, [config, loadProducts]);

  useEffect(() => {
    const productId = searchParams.get('product');
    if (productId && products.length > 0) {
      const product = products.find(p => p.id === productId);
      if (product) {
        setTimeout(() => setSelectedProduct(product), 0);
      }
    }
  }, [searchParams, products]);

  const toggleLocale = () => {
    const newLocale = locale === 'es' ? 'en' : 'es';
    const productParam = searchParams.get('product');
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    setLocale(newLocale);
    window.location.href = productParam ? `/?product=${productParam}` : '/';
  };

  if (configLoading || productsLoading) {
    return <LoadingScreen />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <BackgroundOverlay />
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header
          locale={locale}
          onLanguageToggle={toggleLocale}
          cartCount={cartCount}
        />

        {!selectedProduct && (
          <main style={{ flex: 1, width: '90%', margin: '0 auto', padding: '2rem 1.5rem', paddingTop: '120px' }} className="md:py-16 md:w-[70%]">
            <div className="mb-8 md:mb-12 text-center">
              <h1 className="text-3xl md:text-6xl font-black mb-2 md:mb-4" style={{ color: '#ffffff' }}>{t('title')}</h1>
              <p className="text-base md:text-xl font-medium" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{t('subtitle')}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-4">
              {products.filter(p => p.id).map((product) => (
                <ProductCard key={`${product.id}-${cartCount}`} product={product} onClick={() => {
                  setSelectedProduct(product);
                  router.push(`/catalog?product=${product.id}`, { scroll: false });
                }} />
              ))}
            </div>
          </main>
        )}

        {selectedProduct && (
          <div style={{ flex: 1 }} />
        )}

        {selectedProduct && (
          <ProductModal product={selectedProduct} locale={locale} onClose={() => {
            setSelectedProduct(null);
            router.push('/catalog', { scroll: false });
          }} t={t} setToast={setToast} />
        )}

        <footer style={{ backgroundColor: 'transparent', paddingTop: '20px', paddingBottom: '20px', flexShrink: 0, position: 'relative', zIndex: 100000 }}>
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{t('footer')}</p>
          </div>
        </footer>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <SessionMonitor />
    </div>
  );
}

const ProductCard = memo(function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const t = useTranslations('catalog');
  const mainColor = product.colors[0] || { images: ['/images/loading.png'], price: 0, stock: 0, name: '', hex: '#000000' };
  const mainImage = mainColor.images?.[0] || '/images/loading.png';
  const hoverImage = mainColor.images?.[1] || mainImage;

  return (
    <button
      className="group cursor-pointer w-full text-left product-card relative transform transition-all duration-300 active:scale-[0.98]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setTimeout(() => setIsHovered(false), 150)}
      onClick={onClick}
      type="button"
      style={{ backgroundColor: 'transparent', border: 'none' }}
    >
      <div className="white-glow" style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'transparent',
        transition: 'all 0.3s ease-in-out',
        boxShadow: isHovered ? '1px 3px 124px 98px rgba(var(--accent-color-rgb, 212, 175, 55), 0.75)' : '1px 3px 5px -1px rgba(var(--accent-color-rgb, 212, 175, 55), 0.75)',
        pointerEvents: 'none'
      }}><span></span></div>
      <div className="overflow-hidden shadow-md transition-all duration-300" style={{ borderRadius: '16px', backgroundColor: 'transparent', boxShadow: isHovered ? '0 20px 40px rgba(0,0,0,0.4)' : '0 10px 20px rgba(0,0,0,0.2)', transform: isHovered ? 'translateY(-8px)' : 'translateY(0)' }}>
        <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: 'transparent' }}>
          <ResponsiveProductImage
            src={isHovered && hoverImage ? hoverImage : mainImage}
            alt={product.name}
            width={800}
            height={800}
            loading="eager"
            className="w-full h-full object-cover transition-transform duration-500"
            style={{ transform: isHovered ? 'scale(1.08)' : 'scale(1)' }}
          />

          {/* Overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', opacity: isHovered ? 1 : 0 }}
          >
            <span className="text-sm font-bold uppercase tracking-widest px-6 py-3" style={{ backgroundColor: 'var(--accent-color, #D4AF37)', color: '#000' }}>
              {t('viewDetails')}
            </span>
          </div>

          {mainColor.stock === 0 ? (
            <div className="absolute bottom-3 left-3 px-3 py-1.5 text-xs font-bold animate-pulse" style={{ backgroundColor: '#ff0000', color: '#ffffff' }}>
              {t('soldOut')}
            </div>
          ) : mainColor.stock < 3 ? (
            <div className="absolute bottom-3 left-3 px-3 py-1.5 text-xs font-bold animate-pulse" style={{ backgroundColor: 'transparent', color: 'var(--accent-color, #D4AF37)', border: '1px solid var(--accent-color, #D4AF37)' }}>
              {t('lowStock')}
            </div>
          ) : null}
        </div>
      </div>
      <div className="p-5 transition-all duration-300" style={{ backgroundColor: 'transparent', textAlign: 'right', transform: isHovered ? 'translateY(-5px)' : 'translateY(0)' }}>
        <h3 className="text-2xl md:text-4xl font-bold mb-1 transition-colors duration-300" style={{ color: isHovered ? 'var(--accent-color, #D4AF37)' : '#ffffff' }}>{product.name}</h3>
        <p className="text-3xl md:text-5xl font-black" style={{ color: 'var(--accent-color, #D4AF37)' }}>{formatPrice(mainColor.price)}</p>
      </div>
    </button>
  );
});

function ProductModal({ product, locale, onClose, t, setToast }: {
  product: Product;
  locale: string;
  onClose: () => void;
  t: ReturnType<typeof useTranslations<'catalog'>>;
  setToast: (toast: { message: string; type: 'error' | 'success' | 'info' } | null) => void
}) {
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(0);
  const { stockMap: availableStock, refetch: refetchStock } = useAvailableStock(product.id);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!product) return;

    setTimeout(() => setMounted(true), 0);
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [product.id]);

  useEffect(() => {
    const items = cart.get();
    const existing = items.find(
      i => i.productId === product.id && i.color === product.colors[selectedColor].name
    );
    setCartQuantity(existing ? existing.quantity : 0);
    setAdded(existing ? existing.quantity > 0 : false);
  }, [selectedColor, product.id, product.colors]);

  useEffect(() => {
    const handleCartUpdate = () => {
      const items = cart.get();
      const existing = items.find(
        i => i.productId === product.id && i.color === product.colors[selectedColor].name
      );
      setCartQuantity(existing ? existing.quantity : 0);
      refetchStock(product.id); // Refetch stock después de actualizar carrito
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, [product.id, selectedColor, product.colors, refetchStock]);

  const currentColor = product.colors[selectedColor];
  const images = currentColor.images.filter(img => img && img.trim() !== '');
  const displayImages = images.length > 0 ? images : ['/images/loading.png'];
  const realAvailableStock = availableStock[currentColor.name] ?? currentColor.stock;

  const handleAddToCart = async () => {
    const items = cart.get();
    const existing = items.find(
      i => i.productId === product.id && i.color === currentColor.name
    );

    const totalInCart = existing ? existing.quantity : 0;
    const newTotal = totalInCart + quantity;
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

    if (quantity > realAvailableStock) {
      setToast({ message: t('onlyAvailable', { count: realAvailableStock }), type: 'error' });
      return;
    }

    if (newTotal > 5) {
      setToast({ message: t('maxPerColor', { count: totalInCart }), type: 'error' });
      return;
    }

    if (totalItems + quantity > 5) {
      setToast({ message: t('maxTotal'), type: 'error' });
      return;
    }

    setLoading(true);
    const timestamp = Date.now();

    const cartResult = await cart.add({
      productId: product.id,
      name: product.name,
      color: currentColor.name,
      colorHex: currentColor.hex,
      price: currentColor.price,
      quantity: quantity,
      image: displayImages[0],
    });

    if (!cartResult.success) {
      setLoading(false);
      setToast({ message: cartResult.error || t('errorAdding'), type: 'error' });
      return;
    }

    setAdded(true);
    setCartQuantity(newTotal);
    setToast({ message: t('productAdded'), type: 'success' });
    setLoading(false);
    
    // NO llamar refetchStock aquí - el evento cart-updated lo hará
  };

  const handleQuantityChange = (newQty: number) => {
    if (newQty > realAvailableStock) {
      setToast({ message: t('onlyAvailable', { count: realAvailableStock }), type: 'error' });
      return;
    }
    setQuantity(newQty);
  };

  if (!mounted) return null;

  const modalRoot = document.getElementById('modal-root') || document.body;

  return createPortal(
    <div className="fixed inset-0 bg-black/80" style={{ zIndex: 50000, top: '80px' }}>
    <style dangerouslySetInnerHTML={{
      __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .modal-container { width: 100vw !important; height: calc(100vh - 160px) !important; background-color: transparent !important; overflow-y: scroll !important; -webkit-overflow-scrolling: touch !important; pointer-events: auto !important; margin-top: 80px !important; margin-bottom: 80px !important; }
          .modal-content { display: block !important; height: auto !important; min-height: calc(100vh - 140px) !important; padding-top: 0 !important; }
          .modal-title-wrapper { display: none !important; }
          .modal-images { padding: 0 !important; background-color: transparent !important; padding-top: 80px !important; }
          .modal-info { padding: 1.5rem !important; background-color: transparent !important; }
          .modal-main-image { height: 400px !important; width: 80% !important; margin: 0 auto !important; }
          .modal-main-image img { object-fit: cover !important; }
        }
      `
    }} />
      <button onClick={onClose} className="fixed hover:bg-white rounded-full z-50" style={{ padding: '0.5rem', left: '1.5rem', top: '75px', color: '#000000', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
        <ChevronLeft className="w-6 h-6" />
      </button>
      <div className="modal-title-wrapper" style={{ width: '70%', margin: '0 auto', paddingTop: '5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingBottom: 0 }}>
        <div className="mb-8 md:mb-12 text-center">
          <h1 className="text-6xl font-black mb-4" style={{ color: '#ffffff' }}>{t('edition').toUpperCase()} {product.edition}</h1>
        </div>
      </div>
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 150px)', pointerEvents: 'none' }}>
      <div className="modal-container bg-white" style={{ width: '85vw', height: '85vh', pointerEvents: 'auto' }}>
        <div className="modal-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="modal-images bg-gray-50 p-8 relative">
          <div className="max-w-2xl mx-auto w-full">
            <div className="mb-4 flex items-center justify-center modal-main-image" style={{ backgroundColor: 'transparent', width: '100%', height: '500px' }}>
              <ResponsiveProductImage
                src={displayImages[selectedImage]}
                alt={product.name}
                width={800}
                height={800}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                priority
                loading="eager"
              />
            </div>
            <div className="grid grid-cols-4 gap-3" style={{ marginTop: '1rem' }}>
              {displayImages.map((img, idx) => (
                <button
                  key={`${selectedColor}-${idx}`}
                  onClick={() => setSelectedImage(idx)}
                  className="aspect-square overflow-hidden"
                  style={{ border: idx === selectedImage ? '2px solid #000' : '2px solid #ddd', backgroundColor: 'transparent' }}
                >
                  <Image src={img} alt="" width={200} height={200} className="w-full h-full object-cover" unoptimized />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-info" style={{ paddingRight: '2rem', paddingBottom: '2rem', paddingLeft: '2rem', overflow: 'auto', backgroundColor: 'transparent' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem', marginTop: 0, color: '#ffffff' }} className="md:text-3xl">{product.name}</h1>

          {realAvailableStock > 0 && (
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-color, #ffd624)', marginBottom: '0.75rem' }} className="md:text-2xl">
              {formatPrice(currentColor.price)}
            </div>
          )}

          {realAvailableStock === 0 ? (
            <div style={{ padding: '0.5rem 1rem', backgroundColor: '#ff0000', color: '#ffffff', display: 'inline-block', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
              {t('soldOut')}
            </div>
          ) : realAvailableStock < 3 ? (
            <div style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--accent-color, #ffd624)', color: '#000000', display: 'inline-block', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
              {t('lowStock')}
            </div>
          ) : null}

          <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1.5rem' }}>
            {t('shippingCalculated')}
          </div>

          <p style={{ marginBottom: '1.5rem', lineHeight: '1.6', color: '#ffffff', fontSize: '0.875rem' }} className="md:text-base">
            {locale === 'en' && product.descriptionEn ? product.descriptionEn : product.description}
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#ffffff' }}>{t('color')}</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              {product.colors.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedColor(idx); setSelectedImage(0); }}
                  className="transition-all duration-200 hover:scale-110"
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '50%',
                    border: selectedColor === idx ? '3px solid var(--accent-color, #ffd624)' : '2px solid rgba(255, 255, 255, 0.3)',
                    backgroundColor: color.hex,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: selectedColor === idx ? '0 0 20px rgba(var(--accent-color-rgb, 255, 214, 36), 0.5)' : 'none'
                  }}
                >
                  {selectedColor === idx && <Check className="w-4 h-4 transition-transform duration-200 scale-110" style={{ color: color.hex === '#FFFFFF' ? '#000' : '#fff' }} />}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.875rem', color: '#ffffff', marginTop: '0.5rem' }}>{t(currentColor.name)}</p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#ffffff', marginBottom: '0.5rem' }}>
              {t('quantity')}
              {cartQuantity > 0 && (
                <span style={{ marginLeft: '0.5rem', color: 'var(--accent-color, #ffd624)', fontSize: '0.75rem' }}>({cartQuantity} {t('inCart')})</span>
              )}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', padding: '4px', backgroundColor: 'rgba(255, 255, 255, 0.05)', width: 'fit-content', opacity: realAvailableStock === 0 ? 0.5 : 1 }}>
              <button
                onClick={() => handleQuantityChange(Math.max(1, quantity - 1))}
                disabled={quantity <= 1 || realAvailableStock === 0}
                style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  cursor: (quantity <= 1 || realAvailableStock === 0) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: (quantity <= 1 || realAvailableStock === 0) ? 0.3 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (quantity > 1 && realAvailableStock > 0) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <Minus style={{ width: '16px', height: '16px' }} />
              </button>
              <div style={{
                minWidth: '40px',
                textAlign: 'center',
                color: '#ffffff',
                fontSize: '1.125rem',
                fontWeight: '600',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {quantity}
              </div>
              <button
                onClick={() => handleQuantityChange(Math.min(5, quantity + 1))}
                disabled={quantity >= 5 || realAvailableStock === 0}
                style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  cursor: (quantity >= 5 || realAvailableStock === 0) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: (quantity >= 5 || realAvailableStock === 0) ? 0.3 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (quantity < 5 && realAvailableStock > 0) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <AnimatedButton
              text={realAvailableStock < 1 ? t('soldOut') : (cartQuantity >= 5 ? t('maxReached') : (cartQuantity > 0 ? t('addMore') : (added ? t('added') : t('addToCart'))))}
              onClick={handleAddToCart}
              disabled={cartQuantity >= 5 || realAvailableStock < 1 || loading}
              loading={loading}
              fullWidth
            />
          </div>

          {added && (
            <button
              onClick={() => window.location.href = '/cart'}
              className="transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                width: '100%',
                padding: '0.875rem',
                backgroundColor: '#000000',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '0.875rem',
                border: '2px solid var(--accent-color, #ffd624)',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                boxShadow: '0 4px 12px rgba(var(--accent-color-rgb, 255, 214, 36), 0.2)'
              }}
            >
              {t('goToCart')}
            </button>
          )}

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.2)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                {product.features.map((feature) => (
                  <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Check className="w-4 h-4" style={{ color: 'var(--accent-color, #ffd624)' }} />
                    <span style={{ fontSize: '0.875rem', color: '#ffffff' }}>{feature}</span>
                  </div>
                ))}
              </div>
        </div>
        </div>
      </div>
      </div>
    </div>,
    modalRoot
  );
}

