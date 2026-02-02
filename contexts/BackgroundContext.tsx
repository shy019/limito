'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface BackgroundContextType {
  backgroundImage: string;
  setBackgroundImage: (image: string) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [backgroundImage, setBackgroundImage] = useState('');

  useEffect(() => {
    fetch('/api/store-config?t=' + Date.now())
      .then(res => res.json())
      .then(data => {
        if (data.config?.backgroundImage) {
          setBackgroundImage(data.config.backgroundImage);
        }
      })
      .catch(() => {});
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
