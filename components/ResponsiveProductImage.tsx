'use client';

import Image from 'next/image';

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
  if (fill) {
    return (
      <Image
        src={src}
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
      src={src}
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
