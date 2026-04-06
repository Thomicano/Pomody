import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Key, ArrowRight, X } from "lucide-react";

const GROQ_KEY_STORAGE = "pomody_groq_api_key";

interface MagicAIScreenProps {
  onOpenProfile: () => void;
  onClose?: () => void;
}

interface Message {
  role: "user" | "assistant";
  text: string;
}

export default function MagicAIScreen({ onOpenProfile, onClose }: MagicAIScreenProps) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setApiKey(localStorage.getItem(GROQ_KEY_STORAGE));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !apiKey || isLoading) return;

    const userMsg: Message = { role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: "Sos un asistente de productividad inteligente para Pomody Studio OS. Respondé de forma concisa, amigable, y profesional. Usá español rioplatense." },
              ...messages,
              userMsg
            ],
            temperature: 0.7,
          }),
        }
      );

      if (!res.ok) throw new Error(`Groq API: ${res.status}`);

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "Sin respuesta.";
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      console.error("❌ [MagicAI]", err);
      setMessages((prev) => [...prev, { role: "assistant", text: "Error al conectar con Groq. Verificá tu API Key." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Empty state: No API Key ──
  if (!apiKey) {
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
        <div className="w-full max-w-5xl h-[85vh] bg-white/80 backdrop-blur-xl border border-white/60 rounded-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.1)] flex items-center justify-center">
          <div className="p-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200/50 flex items-center justify-center mb-5">
            <Sparkles size={28} className="text-indigo-400" />
          </div>
          <h2 className="text-lg font-light text-slate-800 tracking-[0.15em] uppercase mb-2">
            IA No Vinculada
          </h2>
          <p className="text-[11px] text-slate-400 tracking-wider leading-relaxed max-w-xs mb-6">
            Para usar Magic AI necesitás vincular tu API Key de Groq en el panel de Perfil.
          </p>
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 text-indigo-600 text-[10px] uppercase tracking-widest font-medium transition-colors"
          >
            <Key size={14} />
            Ir a Perfil
            <ArrowRight size={12} />
          </button>
        </div>
        </div>
      </div>
    );
  }

  // ── Chat UI ──
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
      <div className="w-full max-w-5xl h-[85vh] bg-white/80 backdrop-blur-xl border border-white/60 rounded-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-200/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/50 flex items-center justify-center">
            <Sparkles size={16} className="text-indigo-500" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-slate-800 tracking-[0.1em] uppercase">Magic AI</h2>
            <p className="text-[9px] text-slate-400 tracking-widest uppercase">Powered by Llama 3 (Groq)</p>
          </div>
        </div>

        {/* Messages */}  
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Sparkles size={32} className="text-slate-200 mb-3" />
              <p className="text-xs text-slate-300 tracking-wider">
                Preguntame cualquier cosa sobre productividad, estudio o planificación.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[12px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-cyan-500 text-white rounded-br-md"
                    : "bg-slate-100 text-slate-700 rounded-bl-md border border-slate-200/60"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 border border-slate-200/60 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-5 pb-5 pt-2">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="flex items-center gap-2 bg-slate-50 rounded-2xl border border-slate-200/60 px-4 py-1"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí tu mensaje..."
              className="flex-1 bg-transparent border-none outline-none text-[12px] text-slate-700 placeholder-slate-400 py-2.5"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
