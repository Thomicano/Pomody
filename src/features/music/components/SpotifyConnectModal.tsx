import { motion, AnimatePresence } from "framer-motion";
import { Headphones, X, Link2 } from "lucide-react";

interface SpotifyConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function SpotifyConnectModal({
  isOpen,
  onClose,
  onConnect,
  isLoading = false,
  error = null,
}: SpotifyConnectModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="spotify-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="spotify-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[201] flex items-center justify-center pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-[400px] mx-6 bg-white/[0.04] backdrop-blur-2xl border border-white/[0.1] rounded-3xl p-8 shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/20 hover:text-white/50 transition-colors"
              >
                <X size={16} />
              </button>

              {/* Logo */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1DB954]/20 to-[#1ed760]/10 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-[0_0_40px_rgba(29,185,84,0.1)]">
                    <Headphones className="w-7 h-7 text-[#1DB954]/80" strokeWidth={1.5} />
                  </div>
                  <motion.div
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#1DB954]/20 border border-[#1DB954]/30 flex items-center justify-center"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Link2 size={10} className="text-[#1DB954]" />
                  </motion.div>
                </div>

                <h2 className="text-[16px] font-light text-white/90 tracking-[0.2em] uppercase">
                  Vincular Spotify
                </h2>
                <p className="text-[10px] text-white/30 tracking-[0.15em] uppercase mt-1.5 text-center max-w-[260px]">
                  Conectá tu cuenta para reproducir música y ver tus playlists
                </p>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300/80 text-[10px] uppercase tracking-[0.1em] text-center"
                >
                  {error}
                </motion.div>
              )}

              {/* Connect Button */}
              <motion.button
                onClick={onConnect}
                disabled={isLoading}
                className="group relative w-full py-3.5 rounded-2xl font-medium text-[12px] uppercase tracking-[0.25em] overflow-hidden transition-all disabled:opacity-50 disabled:cursor-wait"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954] to-[#1ed760] opacity-90 group-hover:opacity-100 transition-opacity" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
                <span className="relative z-10 flex items-center justify-center gap-2.5 text-white">
                  {isLoading ? (
                    <motion.div
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 opacity-90">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                      </svg>
                      Vincular Spotify
                    </>
                  )}
                </span>
              </motion.button>

              {/* Skip */}
              <button
                onClick={onClose}
                className="w-full mt-3 py-2 text-[9px] uppercase tracking-[0.2em] text-white/15 hover:text-white/30 transition-colors"
              >
                Ahora no
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
