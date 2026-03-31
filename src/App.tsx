import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PomodoroTimer from "@/components/PomodoroTimer";
import Aurora from "@/components/ui/Aurora";
import MusicWidget from "@/components/MusicWidget";
import FloatingDock from "@/components/FloatingDock";
import { useBackground } from '@/hooks/useBackground';
import { fetchUserEvents } from '@/lib/supabaseClient';

// Screens
import HomeScreen from "@/components/screens/HomeScreen";
import CalendarScreen from "@/components/screens/CalendarScreen";
import VisualPreferencesPanel from "@/components/VisualPreferencesPanel";
import SettingsScreen, { FREE_GRADIENTS } from "@/components/screens/SettingsScreen";

export default function App() {
  const { theme } = useBackground();

  // Test Supabase Frontend Connection
  useEffect(() => {
    fetchUserEvents().then(data => {
      if (data) console.log("🟢 [Supabase] Eventos recuperados:", data.length);
    });
  }, []);

  // Routing State
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false); // 🟢 FIX: Estado global para saber si el panel lateral está abierto

  // Collision Logic Variables
  const [isDockVisible, setIsDockVisible] = useState(false);
  const [isWidgetHovered, setIsWidgetHovered] = useState(false);
  const [widgetY, setWidgetY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setIsDockVisible((prev) => {
        // Franja muy fina de 15px para disparar el dock
        if (!prev && e.clientY >= window.innerHeight - 15) return true;
        // Tolerancia de 100px para mantenerlo abierto al subir a clickear
        if (prev && e.clientY < window.innerHeight - 100) return false;
        return prev;
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Lock Logic: Si está siendo interactuado, congela la traslación Y
  useEffect(() => {
    if (!isWidgetHovered) {
      setWidgetY(isDockVisible ? -90 : 0);
    }
  }, [isDockVisible, isWidgetHovered]);

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

      {/* 1. Capa de Fondo 
       */}
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
          <div className={`absolute inset-0 bg-gradient-to-br transition-colors duration-1000 ${FREE_GRADIENTS.find(g => g.id === theme.activeGradient)?.class || FREE_GRADIENTS[0].class
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

      {/* 3. Lateral Derecho: Pomodoro (Se desvanece si el panel está abierto, sin deesplazamientos) */}
      <div className={`absolute top-1/2 right-[5%] md:right-8 -translate-y-1/2 z-30 transition-all duration-700 flex-shrink-0 origin-right ${
        currentScreen === 'home' 
          ? `pointer-events-auto scale-90 md:scale-100 ${isPreferencesOpen ? 'opacity-0 pointer-events-none blur-[4px]' : 'opacity-100'}` 
          : 'opacity-40 pointer-events-none scale-75 md:scale-95 translate-x-12'
      }`}>
        <PomodoroTimer onCycleComplete={triggerFlash} />
      </div>

      {/* 4. Enrutador Dinámico (Pantallas) */}
      <main className="relative z-50 w-full h-full pointer-events-none">

        {/* Banner Superior OS */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 px-8 py-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 text-[10px] tracking-[0.3em] uppercase opacity-40 z-[100]">
          Pomody Studio OS
        </div>

        <AnimatePresence mode="wait">
          {currentScreen === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, scale: 0.95, filter: "blur(5px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(5px)" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 pointer-events-none z-50"
            >
              <HomeScreen isDockVisible={isDockVisible} />
            </motion.div>
          )}

          {currentScreen === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, scale: 0.95, filter: "blur(5px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(5px)" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 pointer-events-none z-50"
            >
              <CalendarScreen />
            </motion.div>
          )}

          {currentScreen === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, scale: 0.95, filter: "blur(5px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(5px)" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 pointer-events-none z-50"
            >
              <SettingsScreen />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 5. Reproductor Flotante */}
      <motion.div
        animate={{
          y: widgetY,
          opacity: currentScreen === 'home' ? 1 : 0.4,
          scale: currentScreen === 'home' ? 1 : 0.95,
          x: 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed inset-0 z-30 pointer-events-none ${isPreferencesOpen ? 'blur-[2px] opacity-40' : ''}`}
        onMouseEnter={() => setIsWidgetHovered(true)}
        onMouseLeave={() => setIsWidgetHovered(false)}
      >
        <div style={{ pointerEvents: currentScreen === 'home' && !isPreferencesOpen ? 'auto' : 'none' }}>
          <MusicWidget />
        </div>
      </motion.div>

      {/* 🟢 FIX: Panel Lateral Dedicado (Independiente del Routing Full-Screen) */}
      <VisualPreferencesPanel 
        onToggle={(isOpen) => setIsPreferencesOpen(isOpen)} 
      />

      {/* 6. Floating Dock Inteligente (Actúa como Navegador) */}
      <FloatingDock isVisible={isDockVisible} onScreenChange={setCurrentScreen} />
    </div>
  );
}