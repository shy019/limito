'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchStoreConfig } from '@/lib/store-config-cache';

interface BackgroundContextType {
  backgroundImage: string;
  backgroundType: 'image' | 'video';
  setBackgroundImage: (image: string) => void;
  setBackgroundType: (type: 'image' | 'video') => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [backgroundImage, setBackgroundImage] = useState('');
  const [backgroundType, setBackgroundType] = useState<'image' | 'video'>('image');

  useEffect(() => {
    let mounted = true;
    
    fetchStoreConfig()
      .then(data => {
        if (!mounted) return;
        if (data.config?.backgroundImage) {
          setBackgroundImage(data.config.backgroundImage);
        }
        if (data.config?.backgroundType) {
          setBackgroundType(data.config.backgroundType);
        }
      })
      .catch(() => {});
    
    return () => { mounted = false; };
  }, []);

  return (
    <BackgroundContext.Provider value={{ backgroundImage, backgroundType, setBackgroundImage, setBackgroundType }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackground must be used within BackgroundProvider');
  }
  return context;
}
