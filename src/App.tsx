import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PomodoroTimer from "@/components/PomodoroTimer";
import Aurora from "@/components/ui/Aurora";
import MusicWidget from "./features/music/components/MusicWidget";
import FloatingDock from "@/components/FloatingDock";
import { useBackground } from '@/hooks/useBackground';
import AuthScreen from "./features/auth/components/AuthScreen";

// Screens
import HomeScreen from "@/components/screens/HomeScreen";
import CalendarScreen from "@/components/screens/CalendarScreen";
import VisualPreferencesPanel from "@/components/VisualPreferencesPanel";
import SettingsScreen, { FREE_GRADIENTS } from "@/components/screens/SettingsScreen";

export default function App() {
  // 🔐 Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { theme } = useBackground()!;

  // Routing State
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  // Dock Logic
  const [isDockVisible, setIsDockVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setIsDockVisible((prev) => {
        if (!prev && e.clientY >= window.innerHeight - 15) return true;
        if (prev && e.clientY < window.innerHeight - 100) return false;
        return prev;
      });
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

  // 🔒 True cuando hay cualquier overlay/pantalla que requiere fondo limpio
  const shouldHideWidgets = isPreferencesOpen || currentScreen === 'settings';

  // ─── AUTH GATE ───
  if (!isAuthenticated) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="auth-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <AuthScreen onEnter={() => setIsAuthenticated(true)} />
        </motion.div>
      </AnimatePresence>
    );
  }

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

      {/* 3. Lateral Derecho: Pomodoro — desmontado del DOM cuando cualquier overlay está abierto */}
      <AnimatePresence>
        {!shouldHideWidgets && (
          <motion.div
            key="pomodoro-widget"
            initial={{ opacity: 0, scale: 0.9, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(6px)" }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute top-1/2 right-[5%] md:right-8 -translate-y-1/2 z-[60] flex-shrink-0 origin-right ${
              currentScreen === 'home'
                ? 'pointer-events-auto scale-90 md:scale-100'
                : 'opacity-40 pointer-events-none scale-75 md:scale-95 translate-x-12'
            }`}
          >
            <PomodoroTimer onCycleComplete={triggerFlash} />
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* 5. Reproductor Flotante — desmontado del DOM cuando cualquier overlay está abierto */}
      <AnimatePresence>
        {!shouldHideWidgets && (
          <motion.div
            key="music-widget"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <MusicWidget />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🟢 FIX: Panel Lateral Dedicado (Independiente del Routing Full-Screen) */}
      <VisualPreferencesPanel
        onToggle={(isOpen) => setIsPreferencesOpen(isOpen)}
      />

      {/* 6. Floating Dock Inteligente (Actúa como Navegador) */}
      <FloatingDock isVisible={isDockVisible} onScreenChange={setCurrentScreen} />
    </div>
  );
}