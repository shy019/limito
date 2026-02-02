'use client';

import { useBackground } from '@/contexts/BackgroundContext';

export default function BackgroundOverlay() {
  const { backgroundImage } = useBackground();

  return (
    <>
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
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        backgroundColor: 'rgba(0, 0, 0, 0.7)', 
        zIndex: 1 
      }} />
    </>
  );
}
