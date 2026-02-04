'use client';

import { useBackground } from '@/contexts/BackgroundContext';

export default function BackgroundOverlay() {
  const { backgroundImage, backgroundType } = useBackground();

  return (
    <>
      {backgroundType === 'video' ? (
        <video
          autoPlay
          loop
          muted
          playsInline
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
