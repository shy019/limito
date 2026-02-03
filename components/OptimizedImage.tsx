'use client';

import Image from 'next/image';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
}

export default function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  className, 
  priority,
  fill 
}: OptimizedImageProps) {
  // Optimizar URL de Cloudinary automáticamente
  const optimizedSrc = src.includes('cloudinary.com') 
    ? optimizeCloudinaryUrl(src, width, height)
    : src;

  if (fill) {
    return (
      <Image
        src={optimizedSrc}
        alt={alt}
        fill
        className={className}
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    );
  }

  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      width={width || 800}
      height={height || 800}
      className={className}
      priority={priority}
    />
  );
}
