'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchStoreConfig } from '@/lib/store-config-cache';

interface BackgroundContextType {
  backgroundImage: string;
  setBackgroundImage: (image: string) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [backgroundImage, setBackgroundImage] = useState('');

  useEffect(() => {
    let mounted = true;
    
    fetchStoreConfig()
      .then(data => {
        if (!mounted) return;
        if (data.config?.backgroundImage) {
          setBackgroundImage(data.config.backgroundImage);
        }
      })
      .catch(() => {});
    
    return () => { mounted = false; };
  }, []);

  return (
    <BackgroundContext.Provider value={{ backgroundImage, setBackgroundImage }}>
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
