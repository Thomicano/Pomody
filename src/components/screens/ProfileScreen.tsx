import { useState, useEffect } from "react";
import { User, Key, LogOut, ExternalLink, Check, Eye, EyeOff, Sparkles } from "lucide-react";

interface ProfileScreenProps {
  user: { email?: string; user_metadata?: { full_name?: string; avatar_url?: string } } | null;
  onLogout: () => void;
  onClose: () => void;
  onOpenMagicAI?: () => void;
}

const GROQ_KEY_STORAGE = "pomody_groq_api_key";

export default function ProfileScreen({ user, onLogout, onClose, onOpenMagicAI }: ProfileScreenProps) {
  const [groqKey, setGroqKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(GROQ_KEY_STORAGE);
    if (stored) setGroqKey(stored);
  }, []);

  const saveKey = () => {
    localStorage.setItem(GROQ_KEY_STORAGE, groqKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const removeKey = () => {
    localStorage.removeItem(GROQ_KEY_STORAGE);
    setGroqKey("");
  };

  const name = user?.user_metadata?.full_name || "Usuario";
  const email = user?.email || "sin correo";
  const avatar = user?.user_metadata?.avatar_url;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto mt-4 px-4 z-[120]">
      <div className="w-full max-w-lg bg-white/80 backdrop-blur-xl border border-white/60 rounded-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.1)] overflow-hidden">

        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 bg-gradient-to-br from-cyan-50/80 to-white/50 border-b border-slate-200/50">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors text-xs uppercase tracking-widest"
          >
            ✕
          </button>

          <div className="flex items-center gap-4">
            {avatar ? (
              <img src={avatar} alt={name} className="w-14 h-14 rounded-2xl border-2 border-white shadow-md" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-cyan-100 border-2 border-white shadow-md flex items-center justify-center">
                <User size={24} className="text-cyan-600" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-medium text-slate-800 tracking-tight">{name}</h2>
              <p className="text-[11px] text-slate-400 uppercase tracking-widest">{email}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">

          {/* Conexiones de IA */}
          <div>
            <h3 className="text-[10px] text-slate-500 uppercase tracking-[0.25em] font-medium mb-3 flex items-center gap-2">
              <Key size={12} className="text-cyan-500" />
              Conexiones de IA
            </h3>

            <div className="bg-slate-50/80 rounded-2xl border border-slate-200/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-500" />
                  <span className="text-xs text-slate-700 font-medium tracking-wide">Groq API Key</span>
                </div>
                {groqKey && (
                  <button
                    onClick={removeKey}
                    className="text-[9px] text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors"
                  >
                    Desvincular
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-20 text-xs text-slate-700 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={saveKey}
                    className="px-2 py-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-[9px] uppercase tracking-wider font-medium transition-colors"
                  >
                    {saved ? <Check size={12} /> : "OK"}
                  </button>
                </div>
              </div>

              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[9px] text-cyan-600 hover:text-cyan-700 uppercase tracking-widest transition-colors"
              >
                <ExternalLink size={10} />
                Obtener API Key de Groq
              </a>

              {groqKey && onOpenMagicAI && (
                <button
                  onClick={() => { onClose(); onOpenMagicAI(); }}
                  className="w-full mt-1 py-2 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-600 text-[10px] uppercase tracking-widest font-medium hover:bg-indigo-100 transition-colors"
                >
                  ✨ Abrir Magic AI
                </button>
              )}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200/60 text-red-500 text-[11px] uppercase tracking-widest font-medium transition-colors"
          >
            <LogOut size={14} />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
