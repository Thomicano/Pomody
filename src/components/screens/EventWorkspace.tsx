import { useState, useEffect, useRef } from "react";
import {
  Clock, CheckCircle2, Circle, StickyNote, Timer, X,
  Plus, ChevronRight, BookOpen,
} from "lucide-react";
import {
  fetchEventById, updateEvent, fetchNotesForEvent,
  EVENT_TYPE_COLORS, EVENT_TYPE_LABELS,
  supabase,
  type PomodyEvent, type PomodyNote,
} from "@/lib/supabaseClient";

interface EventWorkspaceProps {
  eventId: string;
  onClose: () => void;
  onStartPomodoro?: (eventId: string, eventTitle: string) => void;
}

export default function EventWorkspace({ eventId, onClose, onStartPomodoro }: EventWorkspaceProps) {
  const [event, setEvent] = useState<PomodyEvent | null>(null);
  const [notes, setNotes] = useState<PomodyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState("");
  const descDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load event + notes
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [ev, ns] = await Promise.all([
        fetchEventById(eventId),
        fetchNotesForEvent(eventId),
      ]);
      if (ev) {
        setEvent(ev);
        setDescription(ev.description || "");
      }
      setNotes(ns);
      setLoading(false);
    };
    load();
  }, [eventId]);

  // Toggle completion
  const toggleCompleted = async () => {
    if (!event) return;
    const newVal = !event.is_completed;
    setEvent({ ...event, is_completed: newVal });
    await updateEvent(event.id, { is_completed: newVal });
  };

  // Auto-save description
  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    clearTimeout(descDebounce.current);
    descDebounce.current = setTimeout(() => {
      if (event) updateEvent(event.id, { description: val });
    }, 600);
  };

  // Add note for this event
  const addNote = async () => {
    if (!event) return;
    const { data } = await supabase
      .from("notes")
      .insert({
        user_id: event.user_id,
        event_id: event.id,
        title: "",
        content: "",
        color: "#e0f2fe",
      })
      .select()
      .single();
    if (data) setNotes([data, ...notes]);
  };

  // Update note
  const updateNote = async (noteId: string, field: "title" | "content", value: string) => {
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, [field]: value } : n)));
    await supabase.from("notes").update({ [field]: value }).eq("id", noteId);
  };

  // Delete note
  const deleteNote = async (noteId: string) => {
    await supabase.from("notes").delete().eq("id", noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 text-center">
          <p className="text-slate-400 text-sm">Evento no encontrado</p>
          <button onClick={onClose} className="mt-3 text-cyan-600 text-xs uppercase tracking-widest hover:underline">
            Volver
          </button>
        </div>
      </div>
    );
  }

  const color = event.color || EVENT_TYPE_COLORS[event.event_type] || "#6b7280";
  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);
  const durationMin = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto mt-4 px-4 z-[120]">
      <div className="w-full max-w-2xl max-h-[85vh] bg-white/85 backdrop-blur-xl border border-white/60 rounded-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden">

        {/* ═══ HEADER ═══ */}
        <div className="relative px-7 pt-6 pb-4 border-b border-slate-200/50">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
          >
            <X size={16} />
          </button>

          {/* Type badge + Completion */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[9px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${color}15`, color }}
            >
              {EVENT_TYPE_LABELS[event.event_type]}
            </span>
            <button
              onClick={toggleCompleted}
              className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest transition-colors"
            >
              {event.is_completed ? (
                <>
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-emerald-600 font-medium">Completado</span>
                </>
              ) : (
                <>
                  <Circle size={14} className="text-slate-300" />
                  <span className="text-slate-400">Pendiente</span>
                </>
              )}
            </button>
          </div>

          {/* Title */}
          <h2 className={`text-xl font-medium text-slate-800 tracking-tight ${event.is_completed ? "line-through opacity-50" : ""}`}>
            {event.title}
          </h2>

          {/* Time info */}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <Clock size={12} />
              <span>
                {startDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short" })}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              {startDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} — {endDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="text-[9px] text-slate-300 uppercase tracking-wider">
              {durationMin} min
            </span>
          </div>
        </div>

        {/* ═══ CONTENT ═══ */}
        <div className="flex-1 overflow-y-auto px-7 py-5 space-y-5">

          {/* 🎯 FOCUS SESSION */}
          <div className="bg-gradient-to-r from-cyan-50/80 via-sky-50/60 to-white/40 rounded-2xl border border-cyan-200/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Timer size={18} className="text-cyan-500" />
                </div>
                <div>
                  <p className="text-[12px] font-medium text-slate-700">Sesión de Foco</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider">Pomodoro vinculado al evento</p>
                </div>
              </div>
              <button
                onClick={() => onStartPomodoro?.(event.id, event.title)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-[10px] uppercase tracking-widest font-medium transition-colors shadow-sm"
              >
                <Timer size={12} />
                Iniciar
                <ChevronRight size={10} />
              </button>
            </div>
          </div>

          {/* 📝 DESCRIPTION */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={13} className="text-slate-400" />
              <h3 className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">Descripción</h3>
            </div>
            <textarea
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Agrega notas sobre este evento..."
              rows={3}
              className="w-full bg-slate-50/60 rounded-xl border border-slate-200/60 px-4 py-3 text-[12px] text-slate-700 placeholder-slate-300 outline-none resize-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-200 transition-all leading-relaxed"
            />
          </div>

          {/* 📋 LINKED NOTES */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <StickyNote size={13} className="text-slate-400" />
                <h3 className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">
                  Notas del Evento ({notes.length})
                </h3>
              </div>
              <button
                onClick={addNote}
                className="flex items-center gap-1 text-[9px] text-cyan-600 hover:text-cyan-700 uppercase tracking-widest font-medium transition-colors"
              >
                <Plus size={12} />
                Agregar
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="text-center py-6 bg-slate-50/40 rounded-xl border border-dashed border-slate-200/60">
                <StickyNote size={20} className="text-slate-200 mx-auto mb-2" />
                <p className="text-[10px] text-slate-300 tracking-wider">Sin notas para este evento</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-sky-50/60 rounded-xl border border-sky-200/30 p-3 group relative"
                  >
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="absolute top-2 right-2 p-0.5 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X size={10} />
                    </button>
                    <input
                      value={note.title}
                      onChange={(e) => updateNote(note.id, "title", e.target.value)}
                      placeholder="Título de la nota..."
                      className="bg-transparent border-none outline-none text-[11px] font-semibold text-slate-700 placeholder-slate-400/50 w-full mb-1"
                    />
                    <textarea
                      value={note.content}
                      onChange={(e) => updateNote(note.id, "content", e.target.value)}
                      placeholder="Escribe aquí..."
                      rows={2}
                      className="bg-transparent border-none outline-none resize-none text-[10px] text-slate-600 placeholder-slate-400/40 w-full leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
