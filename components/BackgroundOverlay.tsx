'use client';

import { useBackground } from '@/contexts/BackgroundContext';
import { useState, useEffect } from 'react';

export default function BackgroundOverlay() {
  const { backgroundImage, backgroundType } = useBackground();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (backgroundType === 'image' || !backgroundImage) {
      setShowContent(true);
      return;
    }

    // Precargar video
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
  }, [backgroundImage, backgroundType]);

  // Loading screen
  if (!showContent) {
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
      {backgroundType === 'video' ? (
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
          backgroundImage: `url(${backgroundImage})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
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
