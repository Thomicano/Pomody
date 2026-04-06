import { useState, useEffect, useRef } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  color: string;
  created_at: string;
}

const COLORS = [
  "bg-amber-100/90",
  "bg-rose-100/90",
  "bg-emerald-100/90",
  "bg-sky-100/90",
  "bg-violet-100/90",
  "bg-orange-100/90",
];

const COLOR_VALUES = ["#fef3c7", "#ffe4e6", "#d1fae5", "#e0f2fe", "#ede9fe", "#ffedd5"];

const getRandomColor = () => {
  const i = Math.floor(Math.random() * COLORS.length);
  return { className: COLORS[i], value: COLOR_VALUES[i] };
};

interface NotesScreenProps {
  onClose?: () => void;
}

export default function NotesScreen({ onClose }: NotesScreenProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user and fetch notes
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        const { data } = await supabase
          .from("notes")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });
        if (data) setNotes(data);
      }
      setLoading(false);
    };
    init();
  }, []);

  const addNote = async () => {
    if (!userId || notes.length >= 12) return;
    const color = getRandomColor();
    const newNote: Partial<Note> = {
      user_id: userId,
      title: "",
      content: "",
      color: color.value,
    };

    const { data, error } = await supabase
      .from("notes")
      .insert(newNote)
      .select()
      .single();

    if (data && !error) setNotes([data, ...notes]);
  };

  const deleteNote = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const updateNote = async (id: string, field: "title" | "content", value: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, [field]: value } : n)));
    await supabase.from("notes").update({ [field]: value }).eq("id", id);
  };

  // Map hex color to Tailwind bg class
  const colorToClass = (hex: string) => {
    const idx = COLOR_VALUES.indexOf(hex);
    return idx >= 0 ? COLORS[idx] : "bg-amber-100/90";
  };

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
        <div className="flex items-center justify-between px-8 pt-6 pb-4 border-b border-slate-200/50">
          <div>
            <h2 className="text-lg font-light tracking-[0.2em] text-slate-800 uppercase">Notas</h2>
            <p className="text-[10px] text-slate-400 tracking-widest uppercase mt-0.5">
              {notes.length} nota{notes.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={addNote}
            disabled={notes.length >= 12}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200/60 text-cyan-600 text-[10px] uppercase tracking-widest font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={14} />
            Nueva Nota
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={24} className="text-cyan-500 animate-spin" />
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                <Plus size={24} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-400 tracking-wider">
                Hacé clic en "Nueva Nota" para empezar
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  colorClass={colorToClass(note.color)}
                  onDelete={() => deleteNote(note.id)}
                  onUpdate={updateNote}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NoteCard({
  note,
  colorClass,
  onDelete,
  onUpdate,
}: {
  note: Note;
  colorClass: string;
  onDelete: () => void;
  onUpdate: (id: string, field: "title" | "content", value: string) => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const titleRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = (field: "title" | "content", value: string) => {
    if (field === "title") setTitle(value);
    else setContent(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdate(note.id, field, value);
    }, 500);
  };

  return (
    <div
      className={`group relative rounded-2xl p-4 min-h-[180px] flex flex-col shadow-sm hover:shadow-md transition-all border border-white/40 ${colorClass}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
      }}
    >
      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-2 right-2 p-1 rounded-full bg-black/5 hover:bg-black/10 text-black/30 hover:text-black/60 opacity-0 group-hover:opacity-100 transition-all"
      >
        <X size={12} />
      </button>

      {/* Title */}
      <input
        ref={titleRef}
        value={title}
        onChange={(e) => handleChange("title", e.target.value)}
        placeholder="Título..."
        className="bg-transparent border-none outline-none text-[13px] font-semibold text-slate-700 placeholder-slate-400/60 w-full mb-1.5"
      />

      {/* Content */}
      <textarea
        value={content}
        onChange={(e) => handleChange("content", e.target.value)}
        placeholder="Escribe tu idea..."
        className="flex-1 bg-transparent border-none outline-none resize-none text-[11px] leading-relaxed text-slate-600 placeholder-slate-400/50 w-full"
      />

      {/* Date */}
      <p className="text-[8px] text-slate-400/60 mt-2 uppercase tracking-wider">
        {new Date(note.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
      </p>
    </div>
  );
}
