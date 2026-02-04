'use client';

import { useBackground } from '@/contexts/BackgroundContext';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function BackgroundOverlay() {
  const { backgroundImage, backgroundType, staticBackgroundImage } = useBackground();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const pathname = usePathname();

  // Páginas donde se muestra el video
  const videoPages = ['/password', '/contact', '/policies'];
  const shouldShowVideo = videoPages.includes(pathname);

  // Determinar qué imagen usar
  const imageToShow = shouldShowVideo ? backgroundImage : (staticBackgroundImage || backgroundImage);

  useEffect(() => {
    if (backgroundType === 'image' || !backgroundImage || !shouldShowVideo) {
      setShowContent(true);
      return;
    }

    // Precargar video solo si estamos en una página de video
    const video = document.createElement('video');
    video.src = backgroundImage;
    video.preload = 'auto';
    
    const handleCanPlayThrough = () => {
      setVideoLoaded(true);
      setShowContent(true);
    };

    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.load();

    return () => {
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, [backgroundImage, backgroundType, shouldShowVideo]);

  // Loading screen solo para páginas con video
  if (!showContent && shouldShowVideo && backgroundType === 'video') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{ color: '#fff', fontSize: '1.5rem' }}>Cargando...</div>
      </div>
    );
  }

  return (
    <>
      {backgroundType === 'video' && shouldShowVideo ? (
        <video
          key={backgroundImage}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000',
            zIndex: 0
          }}
        >
          <source src={backgroundImage} type="video/mp4" />
        </video>
      ) : (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          backgroundImage: `url(${imageToShow})`, 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#000',
          zIndex: 0 
        }} />
      )}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        backgroundColor: 'rgba(0, 0, 0, 0.2)', 
        zIndex: 1 
      }} />
    </>
  );
}
