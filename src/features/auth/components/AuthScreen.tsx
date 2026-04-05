import { useState } from "react";
import { motion } from "framer-motion";
import { Music, Zap, Headphones } from "lucide-react";
import Aurora from "@/components/ui/Aurora";
import { useSpotifyAuth } from "../hooks/useSpotifyAuth";

interface AuthScreenProps {
  onEnter: () => void;
}

export default function AuthScreen({ onEnter }: AuthScreenProps) {
  const { login } = useSpotifyAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
    } catch {
      // Si falla el redirect, dejamos entrar al modo demo
      setIsLoading(false);
      onEnter();
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#030810]">
      {/* Aurora Background — más lenta y sutil para la landing */}
      <div className="absolute inset-0 z-0 opacity-70">
        <Aurora colorStops={["#0ea5e9", "#6366f1"]} speed={0.4} />
      </div>

      {/* Noise/grain overlay for depth */}
      <div
        className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Radial spotlight from center */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, transparent 0%, rgba(3,8,16,0.6) 60%, rgba(3,8,16,0.95) 100%)",
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">
        {/* Logo / Brand */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center mb-12"
        >
          {/* Logo icon cluster */}
          <div className="relative mb-6">
            <motion.div
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-[0_0_60px_rgba(14,165,233,0.15)]"
              animate={{ rotateY: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <Headphones className="w-9 h-9 text-cyan-400/80" strokeWidth={1.5} />
            </motion.div>
            {/* Floating particles */}
            <motion.div
              className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-cyan-400/40"
              animate={{ y: [-2, 4, -2], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-1 -left-3 w-2 h-2 rounded-full bg-indigo-400/30"
              animate={{ y: [2, -3, 2], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </div>

          {/* Title */}
          <h1 className="text-[28px] md:text-[36px] font-light text-white tracking-[0.25em] uppercase">
            Pomody
          </h1>
          <p className="text-[10px] md:text-[11px] text-white/30 tracking-[0.5em] uppercase mt-1">
            Studio OS
          </p>
        </motion.div>

        {/* Glass Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[380px] bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 shadow-[0_16px_64px_rgba(0,0,0,0.4)]"
        >
          {/* Feature pills */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {[
              { icon: Zap, label: "Pomodoro" },
              { icon: Music, label: "Spotify" },
              { icon: Headphones, label: "Focus" },
            ].map(({ icon: Icon, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/40"
              >
                <Icon size={11} />
                <span className="text-[9px] uppercase tracking-[0.15em] font-medium">
                  {label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Login Button */}
          <motion.button
            onClick={handleLogin}
            disabled={isLoading}
            className="group relative w-full py-3.5 rounded-2xl font-medium text-[12px] uppercase tracking-[0.25em] overflow-hidden transition-all disabled:opacity-50 disabled:cursor-wait"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Button gradient bg */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-90 group-hover:opacity-100 transition-opacity" />
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />
            {/* Button content */}
            <span className="relative z-10 flex items-center justify-center gap-2.5 text-white">
              {isLoading ? (
                <motion.div
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <>
                  {/* Spotify icon (SVG inline for precision) */}
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 opacity-80">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                  Entrar al Estudio
                </>
              )}
            </span>
          </motion.button>

          {/* Skip / Demo mode */}
          <button
            onClick={onEnter}
            className="w-full mt-3 py-2.5 text-[10px] uppercase tracking-[0.2em] text-white/20 hover:text-white/40 transition-colors"
          >
            Continuar sin cuenta →
          </button>
        </motion.div>

        {/* Bottom tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-10 text-[10px] text-white/15 tracking-[0.2em] uppercase text-center max-w-xs"
        >
          Conectando con tu ecosistema de productividad y música
        </motion.p>
      </div>
    </div>
  );
}
