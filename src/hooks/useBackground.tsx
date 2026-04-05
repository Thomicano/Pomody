import React, { createContext, useContext, useState, type ReactNode } from 'react';

export type BgMode = 'gradient' | 'aurora' | 'image' | 'solid';

export interface AppThemeConfig {
  activeBgMode: BgMode;
  activeGradient: string;
  solidColor: string;
  activeTint: string | null;
  autoAuroraOnBreak: boolean;
  pomodoroSound: string;
  imageParameters: {
    url: string;
    blur: number;
    tint: string;
  };
  auroraParameters: {
    color1: string;
    color2: string;
    color3: string;
    speed: number;
  };
}

const defaultTheme: AppThemeConfig = {
  activeBgMode: 'aurora',
  activeGradient: 'lofi-midnight',
  solidColor: '#1a1a2e',
  activeTint: '#38bdf8',
  autoAuroraOnBreak: true,
  pomodoroSound: 'alert.mp3',
  imageParameters: {
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba',
    blur: 4,
    tint: 'rgba(0,0,0,0.4)'
  },
  auroraParameters: {
    color1: '#00f2fe',
    color2: '#4facfe',
    color3: '#00f2fe',
    speed: 15
  }
};

interface BackgroundContextType {
  theme: AppThemeConfig;
  setTheme: React.Dispatch<React.SetStateAction<AppThemeConfig>>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AppThemeConfig>(defaultTheme);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const localUrl = URL.createObjectURL(file);
        setTheme(prev => ({ 
          ...prev, 
          imageParameters: { ...prev.imageParameters, url: localUrl } 
        }));
      } else {
        alert('Por favor, selecciona un archivo de imagen (.jpg, .png)');
      }
    }
  };

  return (
    <BackgroundContext.Provider value={{ theme, setTheme, handleImageUpload }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  // Retorna undefined en lugar de lanzar si no hay Provider en el árbol
  return context;
}
