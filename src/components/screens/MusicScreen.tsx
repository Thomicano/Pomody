import { useEffect, useState } from "react";
import { Heart, Disc3, Music, Smartphone, Volume2, ExternalLink, X } from "lucide-react";
import { getValidAccessToken } from "@/features/auth/tokenManager";

interface SpotifyItem {
  id: string;
  name: string;
  imageUrl: string;
  subtitle: string;
  uri: string;
}

interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

type Tab = "playlists" | "liked" | "albums" | "devices";

const DEFAULT_IMG = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop";

interface MusicScreenProps {
  onClose?: () => void;
}

export default function MusicScreen({ onClose }: MusicScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>("playlists");
  const [items, setItems] = useState<SpotifyItem[]>([]);
  const [devices, setDevices] = useState<SpotifyDevice[]>([]);
  const [loading, setLoading] = useState(true);

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "playlists", label: "Playlists", icon: Music },
    { id: "liked", label: "Favoritas", icon: Heart },
    { id: "albums", label: "Álbumes", icon: Disc3 },
    { id: "devices", label: "Dispositivos", icon: Smartphone },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = await getValidAccessToken();
        if (!token) return;

        if (activeTab === "devices") {
          const res = await fetch("https://api.spotify.com/v1/me/player/devices", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setDevices(data.devices || []);
          }
        } else {
          const endpoints: Record<string, string> = {
            playlists: "https://api.spotify.com/v1/me/playlists?limit=12",
            liked: "https://api.spotify.com/v1/me/tracks?limit=12",
            albums: "https://api.spotify.com/v1/me/albums?limit=12",
          };

          const res = await fetch(endpoints[activeTab], {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.ok) {
            const data = await res.json();
            let mapped: SpotifyItem[] = [];

            if (activeTab === "playlists") {
              mapped = data.items.map((p: any) => ({
                id: p.id,
                name: p.name,
                imageUrl: p.images?.[0]?.url || DEFAULT_IMG,
                subtitle: `${p.tracks?.total || 0} tracks`,
                uri: p.uri,
              }));
            } else if (activeTab === "liked") {
              mapped = data.items.map((t: any) => ({
                id: t.track.id,
                name: t.track.name,
                imageUrl: t.track.album?.images?.[0]?.url || DEFAULT_IMG,
                subtitle: t.track.artists?.map((a: any) => a.name).join(", ") || "",
                uri: t.track.uri,
              }));
            } else if (activeTab === "albums") {
              mapped = data.items.map((a: any) => ({
                id: a.album.id,
                name: a.album.name,
                imageUrl: a.album.images?.[0]?.url || DEFAULT_IMG,
                subtitle: a.album.artists?.map((ar: any) => ar.name).join(", ") || "",
                uri: a.album.uri,
              }));
            }
            setItems(mapped);
          }
        }
      } catch (err) {
        console.warn("⚠️ [MusicScreen] Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto mt-4 px-4 z-[80] relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-8 right-6 p-2 bg-white/50 hover:bg-white/80 rounded-full text-slate-500 hover:text-slate-800 backdrop-blur-xl border border-slate-200/50 shadow-sm transition-all z-[90]"
        >
          <X size={18} />
        </button>
      )}
      <div className="w-full max-w-5xl h-[85vh] bg-white/80 backdrop-blur-xl border border-white/60 rounded-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.1)] flex overflow-hidden">

        {/* Left sidebar tabs */}
        <div className="w-52 border-r border-slate-200/60 p-6 flex flex-col gap-6 bg-white/40">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-light tracking-[0.15em] text-slate-800 uppercase">Música</h2>
            <p className="text-[10px] text-slate-400 tracking-widest uppercase">Spotify conectado</p>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[11px] uppercase tracking-widest transition-all ${
                  activeTab === id
                    ? "bg-cyan-50 text-cyan-800 border border-cyan-100 shadow-sm font-medium"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Volume (visual) */}
          <div className="mt-auto space-y-2">
            <div className="flex items-center gap-2 text-slate-400">
              <Volume2 size={14} />
              <span className="text-[9px] uppercase tracking-widest">Volumen</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="70"
              className="w-full accent-cyan-500"
            />
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : activeTab === "devices" ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-700 uppercase tracking-wider mb-4">
                Dispositivos disponibles
              </h3>
              {devices.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-12">
                  No hay dispositivos activos
                </p>
              ) : (
                devices.map((d) => (
                  <div
                    key={d.id}
                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all ${
                      d.is_active
                        ? "bg-cyan-50/80 border-cyan-200 shadow-sm"
                        : "bg-white/60 border-slate-200/60 hover:bg-white"
                    }`}
                  >
                    <Smartphone size={18} className={d.is_active ? "text-cyan-500" : "text-slate-400"} />
                    <div className="flex-1">
                      <p className="text-[13px] text-slate-700 font-medium">{d.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{d.type}</p>
                    </div>
                    {d.is_active && (
                      <span className="px-2.5 py-1 bg-cyan-500 text-white text-[8px] uppercase tracking-widest rounded-full font-medium">
                        Activo
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => window.open(`https://open.spotify.com/${activeTab === "playlists" ? "playlist" : activeTab === "liked" ? "track" : "album"}/${item.id}`, "_blank")}
                  className="group relative rounded-2xl overflow-hidden border border-slate-200/60 hover:border-slate-300 hover:shadow-md transition-all bg-white/60"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-2.5">
                    <p className="text-[11px] text-slate-700 font-medium truncate leading-tight">
                      {item.name}
                    </p>
                    <p className="text-[9px] text-slate-400 truncate mt-0.5 uppercase tracking-wider">
                      {item.subtitle}
                    </p>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink size={12} className="text-white drop-shadow-md" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
