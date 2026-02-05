'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchStoreConfig } from '@/lib/store-config-cache';

interface BackgroundContextType {
  backgroundImage: string;
  backgroundType: 'image' | 'video';
  staticBackgroundImage: string;
  accentColor: string;
  setBackgroundImage: (image: string) => void;
  setBackgroundType: (type: 'image' | 'video') => void;
  setStaticBackgroundImage: (image: string) => void;
  setAccentColor: (color: string) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [backgroundImage, setBackgroundImage] = useState('');
  const [backgroundType, setBackgroundType] = useState<'image' | 'video'>('image');
  const [staticBackgroundImage, setStaticBackgroundImage] = useState('');
  const [accentColor, setAccentColor] = useState('#D4AF37');

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
        if (data.config?.staticBackgroundImage) {
          setStaticBackgroundImage(data.config.staticBackgroundImage);
        }
        if (data.config?.accentColor) {
          setAccentColor(data.config.accentColor);
        }
      })
      .catch(() => {});
    
    return () => { mounted = false; };
  }, []);

  // Aplicar color de acento como CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', accentColor);
    
    // Convertir hex a RGB para usar en rgba()
    const hex = accentColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    document.documentElement.style.setProperty('--accent-color-rgb', `${r}, ${g}, ${b}`);
  }, [accentColor]);

  return (
    <BackgroundContext.Provider value={{ backgroundImage, backgroundType, staticBackgroundImage, accentColor, setBackgroundImage, setBackgroundType, setStaticBackgroundImage, setAccentColor }}>
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
