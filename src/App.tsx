import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import DigitalClock from "@/components/DigitalClock";
import PomodoroTimer from "@/components/PomodoroTimer";
import StickyNotes from "@/components/StickyNotes";
import Aurora from "@/components/ui/Aurora";
import VisualPreferencesPanel, { FREE_GRADIENTS } from "@/components/VisualPreferencesPanel";
import MusicWidget from "@/components/MusicWidget";
import FloatingDock from "@/components/FloatingDock";
import PremiumOmnibar from "@/components/PremiumOmnibar";

// Estructura inicial para evitar que el destructuring rompa la app
const DEFAULT_THEME = {
  activeBgMode: 'gradient',
  autoAuroraOnBreak: true,
  activeTint: '#38bdf8', // El tinte azul/cian por defecto
  imageParameters: { url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2000', blur: 0 },
  auroraParameters: { color1: '#38bdf8', color2: '#818cf8', speed: 1 },
  solidColor: '#050b14'
};

export default function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("pomody_theme");
    return saved ? JSON.parse(saved) : DEFAULT_THEME;
  });

  useEffect(() => {
    localStorage.setItem("pomody_theme", JSON.stringify(theme));
  }, [theme]);

  // Collision Logic Variables
  const [isDockVisible, setIsDockVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const threshold = window.innerHeight * 0.9; // 10% inferior de la pantalla
      setIsDockVisible(e.clientY > threshold);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const [tempBgMode, setTempBgMode] = useState<null | 'aurora'>(null);
  const [flashColor, setFlashColor] = useState<null | 'study' | 'break'>(null);
  
  const triggerFlash = (color: 'study' | 'break') => {
    setFlashColor(color);
    setTimeout(() => setFlashColor(null), 600);

    if (color === 'break' && theme.autoAuroraOnBreak) {
      setTempBgMode('aurora');
    } else if (color === 'study') {
      setTempBgMode(null);
    }
  };

  const displayMode = tempBgMode || theme.activeBgMode;

  return (
    <div 
      className="relative w-full h-screen overflow-hidden font-sans antialiased text-white bg-[#050b14] transition-colors duration-1000"
      style={{ '--primary-tint': theme.activeTint || '#ffffff' } as any}
    >
      
      {/* 1. Capa de Fondo Inmersiva */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="absolute inset-0 bg-slate-950" />}>
          {displayMode === 'aurora' && (
            <Aurora 
              colorStops={[theme.auroraParameters.color1, theme.auroraParameters.color2]} 
              speed={theme.auroraParameters.speed} 
            />
          )}
        </Suspense>
        
        {displayMode === 'gradient' && (
          <div className={`absolute inset-0 bg-gradient-to-br transition-colors duration-1000 ${
            FREE_GRADIENTS.find(g => g.id === theme.activeGradient)?.class || FREE_GRADIENTS[0].class
          }`} />
        )}

        {displayMode === 'solid' && (
          <div className="absolute inset-0 transition-colors duration-1000" style={{ backgroundColor: theme.solidColor }} />
        )}

        {displayMode === 'image' && (
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
            style={{ backgroundImage: `url('${theme.imageParameters.url}')`, filter: `blur(${theme.imageParameters.blur}px)` }}
          />
        )}    
      </div>

      {/* Capa 1: Filtro de Tinte Global */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none transition-all duration-1000"
        style={{ 
          backgroundColor: theme.activeTint || 'transparent',
          opacity: theme.activeTint ? 0.3 : 0,
          mixBlendMode: 'overlay'
        }}
      />

      {/* 2. Flash Global */}
      <div className={`fixed inset-0 z-[9999] pointer-events-none transition-opacity duration-500
          ${flashColor === 'study' ? 'bg-white opacity-20' : ''}
          ${flashColor === 'break' ? 'bg-cyan-300 opacity-20' : ''}
          ${flashColor === null ? 'opacity-0' : ''}
      `} />

      {/* 3. Panel de Configuración */}
      <VisualPreferencesPanel theme={theme} setTheme={setTheme} />

      {/* 4. Contenido Frontal */}
      <main className="relative z-10 w-full h-full pointer-events-none">
        
        {/* Banner Superior OS */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 px-8 py-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 text-[10px] tracking-[0.3em] uppercase opacity-40 z-50">
          Pomody Studio OS
        </div>

        {/* Capa Central: Reloj y Buscador */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 pointer-events-none flex-shrink-0 flex flex-col items-center w-full max-w-2xl px-4 md:px-0 z-50">
          <div className="pointer-events-auto w-full flex justify-center"><DigitalClock /></div>
          <div className="pointer-events-auto w-full"><PremiumOmnibar /></div>
        </div>

        {/* Lateral Derecho: Pomodoro */}
        <div className="absolute top-1/2 right-[5%] md:right-24 -translate-y-1/2 z-50 pointer-events-auto flex-shrink-0 scale-90 md:scale-100 transition-transform">
          <PomodoroTimer onCycleComplete={triggerFlash} />
        </div>

        {/* Zona Inferior: StickyNotes con Intelligent Overlap */}
        <motion.div 
          animate={{ y: isDockVisible ? -90 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute bottom-6 left-0 w-full flex justify-center items-center z-20 pointer-events-auto px-4"
        >
          <StickyNotes />
        </motion.div>

      </main>

      {/* 5. Reproductor Flotante con Intelligent Overlap */}
      <motion.div
        animate={{ y: isDockVisible ? -90 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-0 z-[90] pointer-events-none"
      >
        <MusicWidget />
      </motion.div>

      {/* 6. Floating Dock Inteligente */}
      <FloatingDock isVisible={isDockVisible} />
    </div>
  );
}       