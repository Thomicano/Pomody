import { useEffect, useRef, useState } from 'react';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  supabase,
  createEvent,
  getDefaultCalendar,
  createTask,
  type EventType,
  EVENT_TYPE_COLORS,
} from '@/lib/supabaseClient';

// ═══════════════════════════════════════════════════════════
// MOCK AI PARSER — Fallback local cuando la Edge Function falla
// ═══════════════════════════════════════════════════════════

interface ParsedInput {
  title: string;
  start_time: string;
  end_time: string;
  event_type: EventType;
  isTask: boolean;
}

function parseInputFromText(input: string): ParsedInput | null {
  const now = new Date();
  const text = input.trim().toLowerCase();

  // Detect event type
  let eventType: EventType = "OTRO";
  if (/parcial|examen|final|quiz/i.test(input)) eventType = "EXAMEN";
  else if (/tp |tarea|entrega|trabajo/i.test(input)) eventType = "TAREA";
  else if (/repaso|estudiar|práctica|practica|revisar/i.test(input)) eventType = "REPASO";

  // Extract time — patterns: "a las 15", "15:00", "14hs", "a las 9:30"
  let hour = 9, minute = 0;
  let hasExplicitTime = false;
  const timeMatch = text.match(/(?:a las?\s*)?(\d{1,2})(?::(\d{2}))?\s*(?:hs?)?/);
  if (timeMatch) {
    hasExplicitTime = true;
    hour = parseInt(timeMatch[1]);
    minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    if (hour < 6) hour += 12; // Assume PM for low hours
  }

  // Extract date — patterns: "mañana", "lunes", "martes", day number
  let targetDate = new Date(now);

  if (/mañana/.test(text)) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (/pasado\s*mañana/.test(text)) {
    targetDate.setDate(targetDate.getDate() + 2);
  } else {
    const dayNames: Record<string, number> = {
      lunes: 1, martes: 2, miércoles: 3, miercoles: 3,
      jueves: 4, viernes: 5, sábado: 6, sabado: 6, domingo: 0,
    };
    for (const [name, dayNum] of Object.entries(dayNames)) {
      if (text.includes(name)) {
        const currentDay = now.getDay();
        let daysToAdd = dayNum - currentDay;
        if (daysToAdd <= 0) daysToAdd += 7;
        targetDate.setDate(targetDate.getDate() + daysToAdd);
        break;
      }
    }

    // Check for specific day number: "el 15", "día 20"
    const dayNumMatch = text.match(/(?:el|día|dia)\s+(\d{1,2})/);
    if (dayNumMatch) {
      const day = parseInt(dayNumMatch[1]);
      targetDate.setDate(day);
      if (targetDate < now) targetDate.setMonth(targetDate.getMonth() + 1);
    }
  }

  // Build ISO dates
  targetDate.setHours(hour, minute, 0, 0);
  const startTime = targetDate.toISOString();
  const endTime = new Date(targetDate.getTime() + 60 * 60 * 1000).toISOString(); // +1 hour default

  // Build title — use original input cleaned up
  const title = input.trim()
    .replace(/\b(?:mañana|hoy|pasado mañana|lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\b/gi, "")
    .replace(/\b(?:a las?|el|día|dia)\b/gi, "")
    .replace(/\d{1,2}(?::\d{2})?\s*(?:hs?)?/g, "")
    .replace(/\s+/g, " ")
    .trim() || input.trim();

  return { title, start_time: startTime, end_time: endTime, event_type: eventType, isTask: !hasExplicitTime };
}

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export default function PremiumOmnibar({ onClose }: { onClose?: () => void } = {}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (isFocused) inputRef.current?.blur();
        if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Custom browser event for UI triggers
    const handleFocusOmnibar = () => {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    };
    window.addEventListener('focus-omnibar', handleFocusOmnibar);
    window.addEventListener('open-omnibar', handleFocusOmnibar);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('focus-omnibar', handleFocusOmnibar);
      window.removeEventListener('open-omnibar', handleFocusOmnibar);
    };
  }, [isFocused]);

  const handleSubmit = async () => {
    if (!inputValue.trim() || isLoading) return;

    setIsLoading(true);
    setFeedback(null);

    try {
      // Try Edge Function first
      const { data, error } = await supabase.functions.invoke('parse-event', {
        body: { input: inputValue,
          localTime: new Date().toISOString(),
         }
      });
      if (data?.success) {
        console.log("¡Evento creado!", data.event);
        // Aquí podés cerrar el modal o limpiar el input
      }
      if (error) throw error;

      setFeedback({ msg: '🟢 Evento agendado con IA', type: 'success' });
    } catch (e) {
      // Fallback to local mock parser
      console.log("⚡ [Omnibar] Usando parser local (fallback)");

      try {
        const parsed = parseInputFromText(inputValue);
        if (!parsed) throw new Error("No se pudo interpretar el evento");

        // Get user session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error("No authenticated");

        if (parsed.isTask) {
          const created = await createTask({
            user_id: session.user.id,
            title: parsed.title,
            is_completed: false,
          });
          if (created) {
            setFeedback({ msg: `🟢 Tarea agregada: ${parsed.title}`, type: 'success' });
            window.dispatchEvent(new Event("pomodyDataUpdate"));
          }
          else throw new Error("Insert task failed");
        } else {
          // Get default calendar
          const calendar = await getDefaultCalendar();
          if (!calendar) throw new Error("No default calendar");

          const created = await createEvent({
            ...parsed,
            calendar_id: calendar.id,
            user_id: session.user.id,
            description: '',
            color: EVENT_TYPE_COLORS[parsed.event_type],
            all_day: false,
            is_completed: false,
          });

          if (created) {
            setFeedback({ msg: `🟢 Evento agendado: ${parsed.title}`, type: 'success' });
            window.dispatchEvent(new Event("pomodyDataUpdate"));
          }
          else throw new Error("Insert event failed");
        }
      } catch (localErr: any) {
        setFeedback({ msg: `Error: ${localErr.message?.substring(0, 30)}`, type: 'error' });
      }
    }

    setInputValue('');
    setTimeout(() => setFeedback(null), 3500);
    setIsLoading(false);
  };

  return (
    <div className="relative w-full max-w-lg mx-auto mt-6 z-40 pointer-events-auto">
      <div
        className={`relative flex items-center w-full px-4 py-3 bg-black/40 backdrop-blur-xl rounded-full border shadow-lg overflow-hidden group transition-all duration-300 ${isFocused ? 'border-white/30 scale-[1.02]' : feedback?.type === 'success' ? 'border-emerald-500/50' : feedback?.type === 'error' ? 'border-red-500/50' : 'border-white/10'}`}
      >
            <div
              className={`absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent z-0 transition-opacity ${isFocused && !feedback ? 'opacity-100' : 'opacity-0'}`}
              style={{ boxShadow: "0 0 10px 1px rgba(34,211,238,0.5)" }}
            />

        <div className="relative z-10 text-white/50 mr-3 flex-shrink-0">
          {isLoading ? (
            <Loader2 size={18} className="animate-spin text-cyan-400" />
          ) : feedback?.type === 'success' ? (
            <Sparkles size={18} className="text-emerald-400" />
          ) : (
            <Search size={18} className={`transition-colors duration-300 ${isFocused ? 'text-cyan-400' : 'text-white/40'}`} />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={isLoading ? "Groq is thinking..." : feedback ? feedback.msg : "Parcial de Física mañana a las 15..."}
          disabled={isLoading}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`relative z-10 w-full bg-transparent text-sm md:text-base focus:outline-none focus:ring-0 selection:bg-cyan-500/30 ${feedback?.type === 'success' ? 'text-emerald-400 placeholder-emerald-400' : feedback?.type === 'error' ? 'text-red-400 placeholder-red-400' : 'text-white/90 placeholder-white/30'}`}
        />

        <motion.div
          animate={{ opacity: isFocused || inputValue || feedback ? 0 : 1 }}
          className="relative z-10 flex items-center gap-1 opacity-50 ml-3 pointer-events-none"
        >
          <kbd className="font-sans px-2 py-0.5 text-[10px] text-white/60 bg-white/10 rounded-md border border-white/10">
            {navigator.userAgent.includes('Mac') ? '⌘' : 'Ctrl'}
          </kbd>
          <kbd className="font-sans px-2 py-0.5 text-[10px] text-white/60 bg-white/10 rounded-md border border-white/10">
            K
          </kbd>
        </motion.div>
      </div>
    </div>
  );
}
