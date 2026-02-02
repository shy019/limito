'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface ResponsiveProductImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  loading?: 'lazy' | 'eager';
}

export default function ResponsiveProductImage({
  src,
  alt,
  width,
  height,
  className,
  style,
  priority,
  fill,
  sizes,
  loading
}: ResponsiveProductImageProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Determinar la ruta de la imagen según el dispositivo
  const getImageSrc = () => {
    if (!src.includes('/images/products/')) return src;
    
    // Si ya tiene -desktop o -mobile, usar tal cual
    if (src.includes('-desktop.webp') || src.includes('-mobile.webp')) {
      return src;
    }
    
    // Agregar sufijo según dispositivo
    const suffix = isMobile ? '-mobile.webp' : '-desktop.webp';
    return src.replace('.webp', suffix);
  };

  const imageSrc = getImageSrc();

  if (fill) {
    return (
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className={className}
        style={style}
        priority={priority}
        sizes={sizes}
        loading={loading}
        unoptimized
      />
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width || 800}
      height={height || 800}
      className={className}
      style={style}
      priority={priority}
      loading={loading}
      unoptimized
    />
  );
}
