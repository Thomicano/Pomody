import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudRain, Droplets, Thermometer, Wind,
  Play, Pause, SkipForward, SkipBack,
  Clock, Flame, ExternalLink, CloudDrizzle,
} from "lucide-react";
import { useMusicPlayer } from "../hooks/useMusicPlayer";
import { getValidAccessToken } from "../../auth/tokenManager";
import { loadTokens } from "../../auth/tokenManager";

interface SidebarControlProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  imageUrl: string;
  trackCount: number;
}

const DEFAULT_COVER = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop";

export default function SidebarControl({ isOpen, onMouseEnter, onMouseLeave }: SidebarControlProps) {
  const isSpotifyLinked = !!loadTokens();
  const { state, engine } = useMusicPlayer(true);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);

  // Fetch playlists when sidebar opens and Spotify is linked
  useEffect(() => {
    if (!isOpen || !isSpotifyLinked) return;

    const fetchPlaylists = async () => {
      setPlaylistsLoading(true);
      try {
        const token = await getValidAccessToken();
        if (!token) return;

        const res = await fetch("https://api.spotify.com/v1/me/playlists?limit=4", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`${res.status}`);

        const data = await res.json();
        setPlaylists(
          data.items.map((p: any) => ({
            id: p.id,
            name: p.name,
            imageUrl: p.images?.[0]?.url || DEFAULT_COVER,
            trackCount: p.tracks?.total || 0,
          }))
        );
      } catch (err) {
        console.warn("⚠️ [Sidebar] Playlists error:", err);
      } finally {
        setPlaylistsLoading(false);
      }
    };

    fetchPlaylists();
  }, [isOpen, isSpotifyLinked]);

  const progressPercent =
    state && state.durationMs > 0 ? (state.progressMs / state.durationMs) * 100 : 0;

  // Current time for weather widget
  const now = new Date();
  const timeStr = now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          key="sidebar"
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className="fixed left-0 top-0 h-full w-64 z-[140] bg-black/40 backdrop-blur-2xl border-r border-white/[0.06] shadow-[2px_0_30px_rgba(0,0,0,0.4)] flex flex-col"
        >
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 pt-5 pb-6 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/5">

            {/* ═══ WEATHER WIDGET ═══ */}
            <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
              {/* Header — like the reference image */}
              <div
                className="relative p-4 pb-3"
                style={{
                  background: "linear-gradient(135deg, rgba(100,116,139,0.15) 0%, rgba(30,41,59,0.3) 100%)",
                }}
              >
                {/* Cloud texture overlay */}
                <div className="absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                  }}
                />

                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-[15px] text-white/90 font-medium tracking-tight">
                      Córdoba
                    </p>
                    <p className="text-[10px] text-white/30 tracking-wider mt-0.5">
                      {timeStr}
                    </p>
                    <p className="text-[11px] text-white/40 mt-2.5 flex items-center gap-1.5">
                      <CloudDrizzle size={12} className="text-white/30" />
                      Llovizna
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[34px] font-extralight text-white/90 leading-none tracking-tight">
                      12°
                    </p>
                    <p className="text-[9px] text-white/30 tracking-wider mt-1.5">
                      Máx: 14° Mín: 12°
                    </p>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-1.5 p-2.5">
                {[
                  { icon: Droplets, label: "Humedad", value: "45%", color: "text-cyan-400/60" },
                  { icon: Thermometer, label: "Sensación", value: "13°", color: "text-orange-400/60" },
                  { icon: Wind, label: "Viento", value: "10 km/h", color: "text-white/40" },
                  { icon: CloudRain, label: "Lluvia", value: "80%", color: "text-blue-400/60" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div
                    key={label}
                    className="bg-white/[0.03] rounded-xl px-3 py-2.5 flex items-center gap-2.5"
                  >
                    <Icon size={13} className={color} />
                    <div>
                      <p className="text-[12px] text-white/70 font-light leading-none">{value}</p>
                      <p className="text-[8px] text-white/25 uppercase tracking-[0.15em] mt-0.5">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ SPOTIFY PLAYER (only if linked) ═══ */}
            {isSpotifyLinked && (
              <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden ring-1 ring-white/[0.08] flex-shrink-0">
                    <img
                      src={state?.albumArt || DEFAULT_COVER}
                      alt={state?.trackName || ""}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-white/70 font-medium truncate leading-tight">
                      {state?.trackName || "Sin reproducción"}
                    </p>
                    <p className="text-[8px] text-white/25 truncate uppercase tracking-[0.1em] mt-0.5">
                      {state?.artist || "—"}
                    </p>
                  </div>
                  <button
                    onClick={() => engine?.openExternal()}
                    className="text-white/10 hover:text-white/30 transition-colors p-1"
                  >
                    <ExternalLink size={11} />
                  </button>
                </div>

                {/* Progress */}
                <div className="mt-2.5 w-full h-[1.5px] bg-white/[0.05] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white/20 rounded-full"
                    initial={false}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: "linear" }}
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-5 mt-2.5">
                  <button
                    onClick={() => engine?.previous()}
                    className="text-white/25 hover:text-white/50 transition-colors active:scale-90"
                  >
                    <SkipBack size={12} fill="currentColor" />
                  </button>
                  <button
                    onClick={() => (state?.isPlaying ? engine?.pause() : engine?.play())}
                    className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white/70 transition-all active:scale-90"
                  >
                    {state?.isPlaying ? (
                      <Pause size={12} fill="currentColor" />
                    ) : (
                      <Play size={12} fill="currentColor" className="ml-0.5" />
                    )}
                  </button>
                  <button
                    onClick={() => engine?.next()}
                    className="text-white/25 hover:text-white/50 transition-colors active:scale-90"
                  >
                    <SkipForward size={12} fill="currentColor" />
                  </button>
                </div>
              </div>
            )}

            {/* ═══ PLAYLISTS (only if linked) ═══ */}
            {isSpotifyLinked && (
              <div>
                <h3 className="text-[8px] text-white/20 uppercase tracking-[0.3em] font-medium mb-2 px-0.5">
                  Playlists
                </h3>

                {playlistsLoading ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="aspect-square rounded-xl bg-white/[0.03] animate-pulse" />
                    ))}
                  </div>
                ) : playlists.length > 0 ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {playlists.map((pl) => (
                      <button
                        key={pl.id}
                        onClick={() => window.open(`https://open.spotify.com/playlist/${pl.id}`, "_blank")}
                        className="group relative aspect-square rounded-xl overflow-hidden border border-white/[0.04] hover:border-white/10 transition-all"
                      >
                        <img
                          src={pl.imageUrl}
                          alt={pl.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-1.5">
                          <p className="text-[8px] text-white/70 font-medium truncate leading-tight">
                            {pl.name}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] text-white/15 text-center py-4 uppercase tracking-wider">
                    Sin playlists
                  </p>
                )}
              </div>
            )}

            {/* ═══ FOCUS STATS ═══ */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-3.5">
              <h3 className="text-[8px] text-white/20 uppercase tracking-[0.3em] font-medium mb-2.5">
                Hoy
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/[0.07] flex items-center justify-center">
                    <Flame size={12} className="text-cyan-400/50" />
                  </div>
                  <div>
                    <p className="text-[13px] text-white/60 font-light leading-none">4</p>
                    <p className="text-[7px] text-white/20 uppercase tracking-wider mt-0.5">Ciclos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/[0.07] flex items-center justify-center">
                    <Clock size={12} className="text-indigo-400/50" />
                  </div>
                  <div>
                    <p className="text-[13px] text-white/60 font-light leading-none">2h</p>
                    <p className="text-[7px] text-white/20 uppercase tracking-wider mt-0.5">Foco</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
