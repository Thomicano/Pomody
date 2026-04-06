import { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PomodoroTimer from "@/components/PomodoroTimer";
import Aurora from "@/components/ui/Aurora";
import FloatingDock from "@/components/FloatingDock";
import { useBackground } from '@/hooks/useBackground';

// Auth
import AuthScreen from "./features/auth/components/AuthScreen";
import { useGoogleAuth } from "./features/auth/hooks/useGoogleAuth";
import { useSpotifyAuth } from "./features/auth/hooks/useSpotifyAuth";

// Music
import SpotifyConnectModal from "./features/music/components/SpotifyConnectModal";
import SidebarControl from "./features/music/components/SidebarControl";

// Screens
import HomeScreen from "@/components/screens/HomeScreen";
import CalendarScreen from "@/components/screens/CalendarScreen";
import VisualPreferencesPanel from "@/components/VisualPreferencesPanel";
import SettingsScreen, { FREE_GRADIENTS } from "@/components/screens/SettingsScreen";

export default function App() {
  // ═══ AUTH ═══
  const googleAuth = useGoogleAuth();
  const spotifyAuth = useSpotifyAuth();

  const [isDemoMode, setIsDemoMode] = useState(false);
  const isInStudio = googleAuth.isAuthenticated || isDemoMode;

  // ═══ SPOTIFY MODAL ═══
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);

  // Auto-close modal on successful Spotify link
  useEffect(() => {
    if (spotifyAuth.isAuthenticated && isSpotifyModalOpen) {
      setIsSpotifyModalOpen(false);
    }
  }, [spotifyAuth.isAuthenticated, isSpotifyModalOpen]);

  // Dock music click → always opens Spotify modal
  const handleMusicClick = () => setIsSpotifyModalOpen(true);

  // ═══ SIDEBAR — Hover-triggered ═══
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Open sidebar when mouse hits left edge (200ms delay)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientX <= 8 && !isSidebarOpen) {
        if (!sidebarTimerRef.current) {
          sidebarTimerRef.current = setTimeout(() => {
            setIsSidebarOpen(true);
            sidebarTimerRef.current = null;
          }, 200);
        }
      } else if (e.clientX > 8 && sidebarTimerRef.current) {
        // Mouse moved away before delay finished → cancel
        clearTimeout(sidebarTimerRef.current);
        sidebarTimerRef.current = null;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (sidebarTimerRef.current) clearTimeout(sidebarTimerRef.current);
    };
  }, [isSidebarOpen]);

  // ═══ THEME ═══
  const { theme } = useBackground()!;

  // ═══ ROUTING ═══
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  // ═══ DOCK VISIBILITY ═══
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

  // ═══ POMODORO ═══
  const [tempBgMode, setTempBgMode] = useState<null | 'aurora'>(null);
  const [flashColor, setFlashColor] = useState<null | 'study' | 'break'>(null);

  const triggerFlash = (color: 'study' | 'break') => {
    setFlashColor(color);
    setTimeout(() => setFlashColor(null), 600);
    if (color === 'break' && theme.autoAuroraOnBreak) setTempBgMode('aurora');
    else if (color === 'study') setTempBgMode(null);
  };

  const displayMode = tempBgMode || theme.activeBgMode;
  const shouldHideWidgets = isPreferencesOpen || currentScreen === 'settings';

  // ═══ AUTH GATE ═══
  if (googleAuth.isLoading || spotifyAuth.isLoading) {
    return (
      <div className="w-full h-screen bg-[#030810] flex items-center justify-center">
        <motion.div
          className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (!isInStudio) {
    return (
      <AuthScreen
        isLoading={false}
        error={googleAuth.error}
        onLogin={googleAuth.login}
        onSkip={() => setIsDemoMode(true)}
      />
    );
  }

  // ═══ DESKTOP ═══
  return (
    <div
      className="relative w-full h-screen overflow-hidden font-sans antialiased text-white bg-[#050b14] transition-colors duration-1000"
      style={{ '--primary-tint': theme.activeTint || '#ffffff' } as any}
    >
      {/* Background */}
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

      {/* Global Tint */}
      <div
        className="fixed inset-0 z-0 pointer-events-none transition-all duration-1000"
        style={{
          backgroundColor: theme.activeTint || 'transparent',
          opacity: theme.activeTint ? 0.3 : 0,
          mixBlendMode: 'overlay'
        }}
      />

      {/* Flash */}
      <div className={`fixed inset-0 z-[9999] pointer-events-none transition-opacity duration-500
          ${flashColor === 'study' ? 'bg-white opacity-20' : ''}
          ${flashColor === 'break' ? 'bg-cyan-300 opacity-20' : ''}
          ${flashColor === null ? 'opacity-0' : ''}
      `} />

      {/* Pomodoro */}
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

      {/* Screen Router */}
      <main className="relative z-50 w-full h-full pointer-events-none">
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

      {/* Sidebar — hover-triggered, always available */}
      <SidebarControl
        isOpen={isSidebarOpen}
        onMouseEnter={() => setIsSidebarOpen(true)}
        onMouseLeave={() => setIsSidebarOpen(false)}
      />

      {/* Spotify Connect Modal — opened from Dock */}
      <SpotifyConnectModal
        isOpen={isSpotifyModalOpen}
        onClose={() => setIsSpotifyModalOpen(false)}
        onConnect={spotifyAuth.login}
        error={spotifyAuth.error}
      />

      {/* Preferences Panel */}
      <VisualPreferencesPanel
        onToggle={(isOpen) => setIsPreferencesOpen(isOpen)}
      />

      {/* Floating Dock */}
      <FloatingDock
        isVisible={isDockVisible}
        onScreenChange={setCurrentScreen}
        onMusicClick={handleMusicClick}
        isSpotifyLinked={spotifyAuth.isAuthenticated}
      />
    </div>
  );
}