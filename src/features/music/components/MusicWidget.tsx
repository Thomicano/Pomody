import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack, ExternalLink } from "lucide-react";
import { useMusicPlayer } from "../hooks/useMusicPlayer";

const DEFAULT_COVER = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop";

export default function MusicWidget() {
  const { state, engine } = useMusicPlayer(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // ─── Loading State ───
  if (!state) return (
    <div className="fixed bottom-6 right-6 mr-24 z-[60]">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
        <span className="text-[9px] text-white/30 uppercase tracking-[0.2em]">
          Conectando...
        </span>
      </div>
    </div>
  );

  return (
    <div className="fixed bottom-6 right-6 mr-24 z-[60] pointer-events-auto">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* ═══════════════════════════════════════════
             MINIMIZED: Album art pill with pulse ring
             ═══════════════════════════════════════════ */
          <motion.button
            key="minimized"
            onClick={() => setIsExpanded(true)}
            className="relative group cursor-pointer"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Pulse ring when playing */}
            {state.isPlaying && (
              <motion.div
                className="absolute -inset-1.5 rounded-2xl border border-white/20"
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            {/* Album art */}
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.4)] ring-1 ring-white/10">
              <img
                src={state.albumArt || DEFAULT_COVER}
                alt={state.trackName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
            </div>

            {/* Playing indicator dot */}
            {state.isPlaying && (
              <motion.div
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.button>
        ) : (
          /* ═══════════════════════════════════════════
             EXPANDED: Full glassmorphism player
             ═══════════════════════════════════════════ */
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.3)] min-w-[300px]"
          >
            <div className="flex items-center gap-3">
              {/* Album cover — click to collapse */}
              <button
                onClick={() => setIsExpanded(false)}
                className="relative group flex-shrink-0 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden ring-1 ring-white/10 shadow-inner">
                  <img
                    src={state.albumArt || DEFAULT_COVER}
                    alt={state.trackName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                {state.isPlaying && (
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-white/5"
                    animate={{ opacity: [0, 0.15, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </button>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white/90 font-medium truncate text-[12px] tracking-tight leading-tight">
                  {state.trackName}
                </h3>
                <p className="text-white/40 text-[10px] truncate uppercase tracking-[0.15em] mt-0.5">
                  {state.artist}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => engine?.previous()}
                  className="text-white/70 hover:text-white p-1 transition-all active:scale-75"
                  aria-label="Previous"
                >
                  <SkipBack size={14} fill="currentColor" />
                </button>

                <button
                  onClick={() => state.isPlaying ? engine?.pause() : engine?.play()}
                  className="bg-white/10 hover:bg-white/20 text-white/70 hover:text-white p-2 rounded-full transition-all active:scale-90 hover:scale-105"
                  aria-label={state.isPlaying ? "Pause" : "Play"}
                >
                  {state.isPlaying
                    ? <Pause size={14} fill="currentColor" />
                    : <Play size={14} fill="currentColor" className="ml-0.5" />
                  }
                </button>

                <button
                  onClick={() => engine?.next()}
                  className="text-white/70 hover:text-white p-1 transition-all active:scale-75"
                  aria-label="Next"
                >
                  <SkipForward size={14} fill="currentColor" />
                </button>
              </div>

              {/* Separator + External link */}
              <div className="border-l border-white/10 pl-2 ml-1">
                <button
                  onClick={() => engine?.openExternal()}
                  className="text-white/70 hover:text-white/40 transition-colors p-1"
                  aria-label="Open in Spotify"
                >
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            {state.durationMs > 0 && (
              <div className="mt-2.5 mx-0.5">
                <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white/20 rounded-full"
                    initial={false}
                    animate={{ width: `${(state.progressMs / state.durationMs) * 100}%` }}
                    transition={{ duration: 0.5, ease: "linear" }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}