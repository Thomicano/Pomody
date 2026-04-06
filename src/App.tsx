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
import SettingsScreen, { FREE_GRADIENTS } from "@/components/screens/SettingsScreen";
import ProfileScreen from "@/components/screens/ProfileScreen";
import MusicScreen from "@/components/screens/MusicScreen";
import NotesScreen from "@/components/screens/NotesScreen";
import MagicAIScreen from "@/components/screens/MagicAIScreen";
import EventWorkspace from "@/components/screens/EventWorkspace";
import VisualPreferencesPanel from "@/components/VisualPreferencesPanel";

type ModalId = 'calendar' | 'settings' | 'profile' | 'music' | 'notes' | 'magic-ai' | 'event-workspace' | null;

export default function App() {
  // ═══ AUTH ═══
  const googleAuth = useGoogleAuth();
  const spotifyAuth = useSpotifyAuth();

  const [isDemoMode, setIsDemoMode] = useState(false);
  const isInStudio = googleAuth.isAuthenticated || isDemoMode;

  // ═══ MODAL SYSTEM ═══
  const [activeModal, setActiveModal] = useState<ModalId>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);

  // Auto-close Spotify modal on successful link
  useEffect(() => {
    if (spotifyAuth.isAuthenticated && isSpotifyModalOpen) {
      setIsSpotifyModalOpen(false);
    }
  }, [spotifyAuth.isAuthenticated, isSpotifyModalOpen]);

  // ═══ DOCK ACTION HANDLER ═══
  const handleDockAction = (action: string) => {
    if (action === 'home') {
      setActiveModal(null); // Close modal, go to home
      return;
    }
    if (action === 'music') {
      if (spotifyAuth.isAuthenticated) {
        setActiveModal('music');
      } else {
        setIsSpotifyModalOpen(true);
      }
      return;
    }
    setActiveModal(action as ModalId);
  };

  // ═══ SIDEBAR — Hover-triggered ═══
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // ═══ PREFERENCES SIDEBAR ═══
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

  // Pomodoro hides when ANY modal/screen/preference is open
  const shouldHideWidgets = activeModal !== null || isPreferencesOpen;

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
  // Dentro de tu componente App
  
  // ═══ DESKTOP ═══
  return (
    <div
      className="relative w-full h-screen overflow-hidden font-sans antialiased text-white bg-[#050b14] transition-colors duration-1000"
      style={{ '--primary-tint': theme.activeTint || '#ffffff' } as any}
    >
      {/* Background Layer */}
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
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
            style={{ backgroundImage: `url('${theme.imageParameters.url}')`, filter: `blur(${theme.imageParameters.blur}px)` }}
          />
        )}
      </div>

      {/* Global Tint */}
      <div
        className="fixed inset-0 z-0 pointer-events-none transition-all duration-1000"
        style={{ backgroundColor: theme.activeTint || 'transparent', opacity: theme.activeTint ? 0.3 : 0, mixBlendMode: 'overlay' }}
      />

      {/* Flash */}
      <div className={`fixed inset-0 z-[9999] pointer-events-none transition-opacity duration-500
        ${flashColor === 'study' ? 'bg-white opacity-20' : ''}
        ${flashColor === 'break' ? 'bg-cyan-300 opacity-20' : ''}
        ${flashColor === null ? 'opacity-0' : ''}
      `} />

      {/* Pomodoro — hidden when ANY modal is open */}
      <AnimatePresence>
        {!shouldHideWidgets && (
          <motion.div
            key="pomodoro-widget"
            initial={{ opacity: 0, scale: 0.9, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(6px)" }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-1/2 right-[5%] md:right-8 -translate-y-1/2 z-[60] flex-shrink-0 origin-right pointer-events-auto scale-90 md:scale-100"
          >
            <PomodoroTimer onCycleComplete={triggerFlash} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Home Screen (always rendered underneath) */}
      <main className="relative z-50 w-full h-full pointer-events-none">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 px-8 py-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 text-[10px] tracking-[0.3em] uppercase opacity-40 z-[100]">
          Pomody Studio OS
        </div>

        <AnimatePresence>
          {activeModal === null && (
            <motion.div
              key="home-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 pointer-events-none z-50"
            >
              <HomeScreen isDockVisible={isDockVisible} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ═══ MODAL OVERLAY SYSTEM ═══ */}
      <AnimatePresence>
        {activeModal !== null && (
          <>
            {/* Backdrop — click to close */}
            <motion.div
              key="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActiveModal(null)}
              className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-[2px]"
            />

            {/* Modal content */}
            <motion.div
              key={`modal-${activeModal}`}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed inset-0 z-[80] pointer-events-none"
            >
              {activeModal === 'calendar' && (
                <CalendarScreen 
                  onEventClick={(id) => { setSelectedEventId(id); setActiveModal('event-workspace'); }} 
                  onClose={() => setActiveModal(null)}
                />
              )}
              {activeModal === 'event-workspace' && selectedEventId && (
                <EventWorkspace
                  eventId={selectedEventId}
                  onClose={() => { setSelectedEventId(null); setActiveModal('calendar'); }}
                  onStartPomodoro={(id, title) => { console.log('🎯 Pomodoro for:', title, id); setActiveModal(null); }}
                />
              )}
              {activeModal === 'settings' && <SettingsScreen onClose={() => setActiveModal(null)} />}
              {activeModal === 'music' && <MusicScreen onClose={() => setActiveModal(null)} />}
              {activeModal === 'notes' && <NotesScreen onClose={() => setActiveModal(null)} />}
              {activeModal === 'magic-ai' && (
                <MagicAIScreen onClose={() => setActiveModal(null)} onOpenProfile={() => setActiveModal('profile')} />
              )}
              {activeModal === 'profile' && (
                <ProfileScreen
                  user={googleAuth.user}
                  onLogout={() => { googleAuth.logout(); setActiveModal(null); }}
                  onClose={() => setActiveModal(null)}
                  onOpenMagicAI={() => setActiveModal('magic-ai')}
                />
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar — hover-triggered, always available */}
      <SidebarControl
        isOpen={isSidebarOpen}
        onMouseEnter={() => setIsSidebarOpen(true)}
        onMouseLeave={() => setIsSidebarOpen(false)}
      />

      {/* Spotify Connect Modal */}
      <SpotifyConnectModal
        isOpen={isSpotifyModalOpen}
        onClose={() => setIsSpotifyModalOpen(false)}
        onConnect={spotifyAuth.login}
        error={spotifyAuth.error}
      />

      {/* Visual Preferences Panel */}
      <VisualPreferencesPanel onToggle={(isOpen) => setIsPreferencesOpen(isOpen)} />

      {/* Floating Dock */}
      <FloatingDock
        isVisible={isDockVisible}
        onAction={handleDockAction}
        isSpotifyLinked={spotifyAuth.isAuthenticated}
      />
    </div>
  );
}