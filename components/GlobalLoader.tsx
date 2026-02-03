'use client';

import { useState, useEffect } from 'react';
import LoadingScreen from './LoadingScreen';

export default function GlobalLoader({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'complete') {
      checkImages();
    } else {
      window.addEventListener('load', checkImages);
      return () => window.removeEventListener('load', checkImages);
    }
  }, []);

  const checkImages = () => {
    const images = Array.from(document.images);
    
    if (images.length === 0) {
      setImagesLoaded(true);
      setLoading(false);
      return;
    }

    let loadedCount = 0;
    const totalImages = images.length;

    const imageLoaded = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        setImagesLoaded(true);
        setTimeout(() => setLoading(false), 300); // Pequeño delay para transición suave
      }
    };

    images.forEach(img => {
      if (img.complete) {
        imageLoaded();
      } else {
        img.addEventListener('load', imageLoaded);
        img.addEventListener('error', imageLoaded); // Contar errores también
      }
    });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
