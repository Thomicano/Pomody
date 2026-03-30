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
    studyDuration: 0.1 * 60,
    breakDuration: 5 * 60,
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

// Helper para inicializar estado desde localStorage
function getSavedState() {
  const saved = localStorage.getItem("pomodoroState");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        methodId: parsed.methodId || null,
        profile: parsed.profile || "general",
        isBreak: parsed.isBreak ?? false,
      };
    } catch(e) {}
  }
  return { methodId: null, profile: "general", isBreak: false };
}

export default function PomodoroTimer() {
  const savedState = getSavedState();
  const defaultProfile = savedState.profile as StudentProfile;
  
  // Si no hay método guardado manualmente, elegimos el recomendado
  const initialMethodId = savedState.methodId || recommendMethod(defaultProfile);

  const [profile, setProfile] = useState<StudentProfile>(defaultProfile);
  const [methodId, setMethodId] = useState<string>(initialMethodId);
  const [isBreak, setIsBreak] = useState<boolean>(savedState.isBreak);
  
  const activeMethod = STUDY_METHODS[methodId] || STUDY_METHODS["pomodoro"];

  // El tiempo inicial depende del modo elegido o restaurado
  const initTime = isBreak ? activeMethod.breakDuration : activeMethod.studyDuration;
  const [timeLeft, setTimeLeft] = useState(initTime);

  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Guardar contexto en formato persistente
  useEffect(() => {
    localStorage.setItem("pomodoroState", JSON.stringify({
      methodId, profile, isBreak
    }));
  }, [methodId, profile, isBreak]);

  // Selección manual
  const handleModeSelect = (newMethodId: string) => {
    setMethodId(newMethodId);
    setIsBreak(false);
    setTimeLeft(STUDY_METHODS[newMethodId].studyDuration);
    setIsActive(false);
    setIsFinished(false);
    setIsMenuOpen(false);
  };

  // Motor principal del temporizador
  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0 && !isFinished) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0 && !isFinished) {
      setIsFinished(true); // Activa fase de animación sin apagar isActive
    }

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isActive, timeLeft, isFinished]);

  // Motor de transición inteligente (Ciclos Automáticos)
  useEffect(() => {
    let finishTimeout: number | undefined;

    if (isFinished) {
      finishTimeout = window.setTimeout(() => {
        if (!isBreak) {
          // Iniciar Descanso
          setIsBreak(true);
          setTimeLeft(activeMethod.breakDuration);
          setCycleCount(c => c + 1);
        } else {
          // Terminar descanso, nuevo estudio
          setIsBreak(false);
          setTimeLeft(activeMethod.studyDuration);
        }
        setIsFinished(false); 
        // isActive sigue siendo true! El siguiente ciclo arrancará inmediatamente tras la animación.
      }, 1500);
    }

    return () => {
      if (finishTimeout) window.clearTimeout(finishTimeout);
    };
  }, [isFinished, isBreak, activeMethod]);

  // Gestor del menú flotante
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
      setIsActive(!isActive);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const totalTime = isBreak ? activeMethod.breakDuration : activeMethod.studyDuration;
  const progress = timeLeft / totalTime;

  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // Variables Dinámicas Requeridas para UX Visual
  const strokeColorClass = isBreak ? "stroke-cyan-300/80" : "stroke-white";
  const textColorClass = isBreak ? "text-cyan-50/90" : "text-white/90";
  const ringBgClass = isBreak ? "stroke-cyan-900/40" : "stroke-white/5";

  return (
    <div className="flex flex-col items-center justify-center font-sans w-full h-full relative">
      
      {/* Target Selector de Perfil IA Funcional */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-50 opacity-50 hover:opacity-100 transition-opacity">
        <label className="text-[9px] text-white/60 uppercase tracking-widest hidden sm:block">Perfil Estudiante:</label>
        <select 
          value={profile} 
          onChange={(e) => {
            const p = e.target.value as StudentProfile;
            setProfile(p);
            // Recomendar inmediatamente si no está activo y cambiamos perfil
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
      <div className="relative mb-12 z-20" ref={menuRef}>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`flex items-center gap-2 transition-colors uppercase text-[10px] font-medium tracking-[0.2em] ${isBreak ? 'text-cyan-300 pointer-events-none' : 'text-white/60 hover:text-white/90'}`}
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

      {/* Timer Display */}
      <div className="relative w-[320px] h-[320px] flex items-center justify-center mb-10">
        <svg 
          className="absolute w-full h-full transform -rotate-90 pointer-events-none overflow-visible" 
          viewBox="0 0 320 320"
        >
          {/* Background Ring */}
          <circle 
            cx="160" cy="160" r={radius} 
            className={`${ringBgClass} transition-colors duration-1000`} 
            strokeWidth="0.75" fill="transparent" 
          />
          
          {/* Progress Ring */}
          <circle 
            cx="160" cy="160" r={radius} 
            className={`
              transition-all duration-1000 ease-linear 
              ${strokeColorClass}
              ${isFinished ? 'opacity-0' : 'opacity-100'}
            `} 
            style={{ 
              strokeDasharray: circumference, 
              strokeDashoffset: strokeDashoffset,
            }}
            strokeWidth="2" 
            fill="transparent" 
            strokeLinecap="round"
          />

          {/* Expansive Pulse Effect on Transition */}
          <circle 
            cx="160" cy="160" r={radius} 
            className={`
              ${strokeColorClass} transition-all duration-1500 ease-out 
              ${isFinished ? 'opacity-0 scale-[1.3]' : 'opacity-0 scale-100'}
            `} 
            style={{ transformOrigin: '160px 160px' }}
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
            <span className={`text-[5.5rem] font-extralight tracking-tighter tabular-nums leading-none transition-colors duration-1000 ${textColorClass}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>

          <div 
            className={`absolute transition-all duration-700 ease-out ${
              isFinished ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-sm pointer-events-none'
            }`}
          >
            <span className={`text-[1.35rem] font-light tracking-[0.3em] uppercase ${textColorClass}`}>
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
          <div className={`absolute bottom-1 left-0 w-full h-[1px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center ${
            isBreak ? 'bg-cyan-300' : 'bg-white/30'
          }`} />
        </button>

        {/* Contextual description - Visible when timer is not active */}
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