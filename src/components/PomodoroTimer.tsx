import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

export type StudentProfile = "ingenieria" | "programacion" | "secundaria" | "general";

export interface StudyMethod {
  id: string;
  name: string;
  studyDuration: number;
  breakDuration: number;
  recommendedFor: StudentProfile[];
  description: string;
}

const STUDY_METHODS: Record<string, StudyMethod> = {
  pomodoro: {
    id: "pomodoro",
    name: "Pomodoro",
    studyDuration: 0.1 * 60, // Mantenido corto para testing, reemplaza por 25*60 luego
    breakDuration: 0.1 * 60,
    recommendedFor: ["secundaria"],
    description: "Perfecto para construir hábito de estudio",
  },
  "50-10": {
    id: "50-10",
    name: "50/10",
    studyDuration: 50 * 60,
    breakDuration: 10 * 60,
    recommendedFor: ["programacion", "general"],
    description: "Ideal para sesiones largas de concentración",
  },
  deepwork: {
    id: "deepwork",
    name: "Deep Work",
    studyDuration: 90 * 60,
    breakDuration: 15 * 60,
    recommendedFor: ["ingenieria"],
    description: "Recomendado para problemas complejos de Ingeniería",
  }
};

function recommendMethod(profile: string): string {
  if (profile === "ingenieria") return "deepwork";
  if (profile === "programacion") return "50-10";
  if (profile === "secundaria") return "pomodoro";
  return "pomodoro"; // fallback
}

// ==========================================
// 2. Preparación para Persistencia (Auth Ready)
// ==========================================
interface SessionData {
  userId?: string;
  methodId: string;
  profile: StudentProfile;
  cycleCount: number;
  lastUpdated: string;
}

const saveSessionData = async (data: SessionData) => {
  try {
    // Almacenamiento local temporal / offline
    localStorage.setItem("pomodoro_session", JSON.stringify(data));
    
    // Auth-Ready: Si el usuario está logueado, sincroniza con DB. Preparado para Supabase.
    if (data.userId) {
      // await supabase.from('study_sessions').upsert([data])
      console.log("Sesión enviada a Supabase para el usuario", data.userId);
    }
  } catch(e) {
    console.warn("Fallo al guardar sesión", e);
  }
}

function getSavedSession(): Partial<SessionData> {
  const saved = localStorage.getItem("pomodoro_session");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch(e) {}
  }
  return {};
}

// 1. Audio Notification Factory (Carga desde Carpeta /sounds)
const playNotificationSound = (soundName = 'alert.mp3') => {
  const audio = new Audio(`/sounds/${soundName}`);
  audio.volume = 0.5;
  audio.play().catch(e => console.warn("Interactúa con la página para activar el sonido", e));
};

import { useBackground } from "@/hooks/useBackground";

export default function PomodoroTimer({ 
  onCycleComplete 
}: { 
  onCycleComplete: (mode: 'study' | 'break') => void;
}) {
  const { theme } = useBackground();
  const savedSession = getSavedSession();
  const defaultProfile = (savedSession.profile as StudentProfile) || "general";
  const initialMethodId = savedSession.methodId || recommendMethod(defaultProfile);
  const initialCycleCount = savedSession.cycleCount || 0;

  const [profile, setProfile] = useState<StudentProfile>(defaultProfile);
  const [methodId, setMethodId] = useState<string>(initialMethodId);
  const [isBreak, setIsBreak] = useState<boolean>(false);
  
  const activeMethod = STUDY_METHODS[methodId] || STUDY_METHODS["pomodoro"];

  const initTime = isBreak ? activeMethod.breakDuration : activeMethod.studyDuration;
  const [timeLeft, setTimeLeft] = useState(initTime);

  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [cycleCount, setCycleCount] = useState(initialCycleCount);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync data whenever critical states change (Auth-Ready Save)
  useEffect(() => {
    saveSessionData({
      userId: undefined, // Sustituir luego: const { user } = useAuth();
      methodId,
      profile,
      cycleCount,
      lastUpdated: new Date().toISOString()
    });
  }, [methodId, profile, cycleCount]);

  const handleModeSelect = (newMethodId: string) => {
    setMethodId(newMethodId);
    setIsBreak(false);
    setTimeLeft(STUDY_METHODS[newMethodId].studyDuration);
    setIsActive(false);
    setIsFinished(false);
    setIsMenuOpen(false);
  };

  // 3. Motor principal del temporizador
  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0 && !isFinished) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0 && !isFinished) {
      // Activa fase de animación ininterrumpida
      setIsFinished(true); 
      // Play Feedback de Sonido Sensorial
      playNotificationSound(theme?.pomodoroSound || 'alert.mp3');
    }

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isActive, timeLeft, isFinished]);

  /// Transiciones 100% Automáticas
useEffect(() => {
  let finishTimeout: number | undefined;

  if (isFinished) {
    finishTimeout = window.setTimeout(() => {
      if (!isBreak) {
        // --- AQUÍ: ENTRA EN DESCANSO ---
        setIsBreak(true);
        setTimeLeft(activeMethod.breakDuration);
        setCycleCount(c => c + 1);

        // ¡SEÑAL PARA EL FLASH DE DESCANSO!
        onCycleComplete('break'); 

      } else {
        // --- AQUÍ: TERMINA DESCANSO, VUELVE A ESTUDIO ---
        setIsBreak(false);
        setTimeLeft(activeMethod.studyDuration);

        // ¡SEÑAL PARA EL FLASH DE ESTUDIO!
        onCycleComplete('study');
      }
      
      setIsFinished(false); 
      // Opcional: Si quieres que empiece solo el siguiente ciclo:
      // setIsActive(true); 
    }, 1500); // Esos 1.5s de gracia para la animación
  }

  return () => {
    if (finishTimeout) window.clearTimeout(finishTimeout);
  };
}, [isFinished, isBreak, activeMethod, onCycleComplete]); // Agregamos onCycleComplete al array de dependencias

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTimer = () => {
    if (!isFinished) {
      setIsActive(prev => !prev);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const totalTime = isBreak ? activeMethod.breakDuration : activeMethod.studyDuration;
  const progress = timeLeft / totalTime;

  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const textColorClass = isBreak ? "text-white" : "text-white/90";

  return (
    <div className="flex flex-col items-center justify-center font-sans w-full h-full relative z-50">
      
        {/* 1. Feedback Sensorial (Estilos CSS Injectados) */}
        <style>{`
          @keyframes subtle-shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-10px); }
            40% { transform: translateX(10px); }
            60% { transform: translateX(-5px); }
            80% { transform: translateX(5px); }
          }
          .animate-shake {
            animation: subtle-shake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
          }
          
          @keyframes full-screen-flash {
            0% { opacity: 0.5; }
            100% { opacity: 0; }
          }
          .animate-flash {
            animation: full-screen-flash 0.6s ease-out forwards;
          }
        `}</style>

      {/* Target Selector de Perfil IA Funcional */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-50 opacity-50 hover:opacity-100 transition-opacity">
        <label className="text-[9px] text-white/60 uppercase tracking-widest hidden sm:block">Perfil Estudiante:</label>
        <select 
          value={profile} 
          onChange={(e) => {
            const p = e.target.value as StudentProfile;
            setProfile(p);
            if (!isActive) {
              const recommended = recommendMethod(p);
              if (recommended !== methodId) {
                handleModeSelect(recommended);
              }
            }
          }}
          className="bg-transparent border-b border-white/20 text-white/90 text-[10px] py-1 px-1 outline-none uppercase cursor-pointer transition-colors"
        >
          <option value="general" className="bg-slate-900">General</option>
          <option value="secundaria" className="bg-slate-900">Secundaria</option>
          <option value="programacion" className="bg-slate-900">Programación</option>
          <option value="ingenieria" className="bg-slate-900">Ingeniería</option>
        </select>
      </div>

      {/* Menu Principal de Método */}
      <div className="relative mb-12 z-50" ref={menuRef}>
        <button 
          type="button"
          onClick={() => !isBreak && setIsMenuOpen(!isMenuOpen)}
          className={`flex items-center gap-2 transition-colors uppercase text-[10px] font-medium tracking-[0.2em] ${isBreak ? 'text-cyan-300 opacity-80 cursor-default' : 'text-white/60 hover:text-white/90'}`}
        >
          {isBreak ? (
            <span className="tracking-[0.3em] font-light">RELAX</span>
          ) : (
            <span>{activeMethod.name}</span>
          )}
          {!isBreak && <ChevronDown className={`w-3 h-3 transition-transform duration-500 ease-out flex-shrink-0 ${isMenuOpen ? 'rotate-180' : ''}`} />}
        </button>

        {!isBreak && (
          <div 
            className={`absolute top-full mt-6 left-1/2 -translate-x-1/2 w-52 py-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] overflow-hidden flex flex-col pointer-events-auto transition-all duration-300 origin-top
              ${isMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
            `}
          >
            {Object.values(STUDY_METHODS).map((m) => (
              <button
                key={m.id}
                onClick={() => handleModeSelect(m.id)}
                className={`px-5 py-4 text-[10px] uppercase tracking-[0.1em] text-left transition-colors duration-200 border-b border-white/5 last:border-0 ${
                  methodId === m.id 
                    ? 'bg-white/10 text-white font-semibold' 
                    : 'text-white/50 hover:bg-white/10 hover:text-white'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Timer Display (Con animación de Shake integrada) */}
      <div className={`relative w-[320px] h-[320px] flex items-center justify-center mb-10 ${isFinished ? 'animate-shake' : ''}`}>
        <svg 
          className="absolute w-full h-full transform -rotate-90 pointer-events-none overflow-visible" 
          viewBox="0 0 320 320"
        >
          {/* Background Ring */}
          <circle 
            cx="160" cy="160" r={radius} 
            className={`transition-colors duration-1000`} 
            style={{ stroke: 'var(--primary-tint)', opacity: 0.15 }}
            strokeWidth="0.75" fill="transparent" 
          />
          
          {/* Progress Ring */}
          <circle 
            cx="160" cy="160" r={radius} 
            className={`
              transition-all duration-1000 ease-linear 
              ${isFinished ? 'opacity-0' : 'opacity-100'}
            `} 
            style={{ 
              strokeDasharray: circumference, 
              strokeDashoffset: strokeDashoffset,
              stroke: 'var(--primary-tint)'
            }}
            strokeWidth="2" 
            fill="transparent" 
            strokeLinecap="round"
          />

          {/* Expansive Pulse Effect on Transition */}
          <circle 
            cx="160" cy="160" r={radius} 
            className={`
              transition-all duration-1500 ease-out 
              ${isFinished ? 'opacity-0 scale-[1.3]' : 'opacity-0 scale-100'}
            `} 
            style={{ 
              transformOrigin: '160px 160px',
              stroke: 'var(--primary-tint)'
            }}
            strokeWidth="2.5" 
            fill="transparent" 
          />
        </svg>

        {/* Dynamic Center Text */}
        <div className="absolute flex flex-col items-center justify-center">
          <div 
            className={`transition-all duration-700 ease-out absolute flex flex-col items-center justify-center ${
              isFinished ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'
            }`}
          >
            <span 
              className={`text-[5.5rem] font-extralight tracking-tighter tabular-nums leading-none transition-colors duration-1000 ${textColorClass}`}
              style={{ color: isBreak ? 'var(--primary-tint)' : 'rgba(255,255,255,0.9)' }}
            >
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>

          <div 
            className={`absolute transition-all duration-700 ease-out ${
              isFinished ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-sm pointer-events-none'
            }`}
          >
            <span 
              className="text-[1.35rem] font-light tracking-[0.3em] uppercase"
              style={{ color: isBreak ? 'var(--primary-tint)' : 'rgba(255,255,255,0.9)' }}
            >
              {isBreak ? "¡A ESTUDIAR!" : "¡TIEMPO!"}
            </span>
          </div>
        </div>
      </div>

      {/* Start Control & Feedback Panel */}
      <div className="flex flex-col items-center h-24">
        <button 
          onClick={toggleTimer}
          className={`uppercase tracking-[0.3em] text-[11px] font-light transition-all duration-500 relative group overflow-hidden ${
            isBreak ? 'text-cyan-300 hover:text-cyan-100' : 'text-white/50 hover:text-white/90'
          } ${
            isFinished ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'
          }`}
        >
          <span className="relative z-10 px-6 py-2 block">
            {isActive ? "Pausar" : (isBreak ? "Reanudar Descanso" : "Iniciar")}
          </span>
          <div className="absolute bottom-1 left-0 w-full h-[1px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center"
               style={{ backgroundColor: 'var(--primary-tint)' }} 
          />
        </button>

          
        <div className={`mt-6 text-center max-w-xs transition-all duration-700 ${!isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
          <span className="text-[10px] text-white/40 tracking-[0.05em] font-light leading-relaxed block px-4 text-center">
            {activeMethod.description}
          </span>
          {!isBreak && cycleCount > 0 && (
            <span className="text-[9px] text-cyan-200/50 tracking-widest uppercase mt-2 block">
              Ciclos completados: {cycleCount}
            </span>
          )}
        </div>
      </div>

    </div>
  );
}