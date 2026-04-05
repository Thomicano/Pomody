import { useMusicPlayer } from "../hooks/useMusicPlayer";
// Usaremos iconos reales en vez de emojis para que sea Pro
import { Play, Pause, SkipForward, SkipBack, ExternalLink } from "lucide-react";

export default function MusicWidget() {
  const { state, engine } = useMusicPlayer(true);

  if (!state) return (
    <div className="glass-panel p-3 rounded-2xl bg-white/5 animate-pulse w-64 text-[10px] text-white/30 tracking-tighter">
      CONECTANDO CON EL MOTOR DE AUDIO...
    </div>
  );

  return (
    /* 🟢 Ajustamos el margen derecho (mr-16) para que la tuerca no lo tape */
    <div className="glass-panel p-2.5 rounded-2xl flex items-center gap-4 border border-white/10 shadow-2xl bg-black/40 backdrop-blur-xl min-w-[320px] mr-20 transition-all hover:bg-black/60">
      
      {/* Portada con efecto de brillo */}
      <div className="relative group overflow-hidden rounded-lg shadow-inner">
        <img 
          src={state.albumArt || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=100&auto=format&fit=crop"} 
          className="w-12 h-12 object-cover transition-transform group-hover:scale-110"
        />
        {state.isPlaying && (
          <div className="absolute inset-0 bg-cyan-500/10 animate-pulse" />
        )}
      </div>
      
      {/* Información de la pista */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold truncate text-[13px] tracking-tight">
          {state.trackName}
        </h3>
        <p className="text-cyan-400/70 text-[10px] truncate font-medium uppercase tracking-[0.15em]">
          {state.artist}
        </p>
      </div>

      {/* Controles de Audio Estilizados */}
      <div className="flex items-center gap-3 pr-2">
        <button onClick={() => engine?.previous()} className="text-white/40 hover:text-white transition-all active:scale-75">
          <SkipBack size={16} fill="currentColor" />
        </button>
        
        <button 
          onClick={() => state.isPlaying ? engine?.pause() : engine?.play()} 
          className="bg-white text-black p-1.5 rounded-full hover:scale-110 transition-all active:scale-90 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
        >
          {state.isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" className="ml-0.5" />}
        </button>

        <button onClick={() => engine?.next()} className="text-white/40 hover:text-white transition-all active:scale-75">
          <SkipForward size={16} fill="currentColor" />
        </button>
      </div>

      {/* Botón para abrir Spotify original */}
      <button onClick={() => engine?.openExternal()} className="text-white/20 hover:text-cyan-400 transition-colors border-l border-white/10 pl-2">
        <ExternalLink size={14} />
      </button>
    </div>
  );
}