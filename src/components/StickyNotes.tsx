import { useState, useEffect, useRef } from "react";
import { X, Plus } from "lucide-react";

export interface StickyNoteData {
  id: string;
  text: string;
  color: string;
  tapeColor: string;
  rotation: number;
}

const PAPER_COLORS = [
  "bg-amber-100/95", 
  "bg-rose-100/95", 
  "bg-emerald-100/95", 
  "bg-blue-100/95", 
  "bg-violet-100/95",
  "bg-orange-100/95"
];
const TAPE_COLORS = [
  "bg-yellow-300/40", 
  "bg-blue-300/40", 
  "bg-rose-300/40", 
  "bg-slate-300/40",
  "bg-green-300/40"
];

const getRandomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
const getRandomRotation = () => Math.floor(Math.random() * 7) - 3; // -3 to 3
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function StickyNotes() {
  const [notes, setNotes] = useState<StickyNoteData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("pomody_sticky_notes");
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing sticky notes", e);
      }
    } else {
      setNotes([
        {
          id: generateId(),
          text: "¡Escribe tus ideas aquí!\n\nHaz clic en cualquier parte de la nota para editar.",
          color: "bg-amber-100/95",
          tapeColor: "bg-yellow-300/40",
          rotation: -2,
        }
      ]);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("pomody_sticky_notes", JSON.stringify(notes));
    }
  }, [notes, isLoaded]);

  const addNote = () => {
    if (notes.length >= 6) return; // Limitar a 6 para evitar overflow en pantalla
    
    const newNote: StickyNoteData = {
      id: generateId(),
      text: "",
      color: getRandomItem(PAPER_COLORS),
      tapeColor: getRandomItem(TAPE_COLORS),
      rotation: getRandomRotation(),
    };
    setNotes([...notes, newNote]);
  };

  const deleteNote = (id: string) => {
    setNotes((prevNotes) => prevNotes.filter(note => note.id !== id));
  };

  const updateNoteText = (id: string, text: string) => {
    setNotes((prevNotes) => prevNotes.map(note => note.id === id ? { ...note, text } : note));
  };

  if (!isLoaded) return null;

  return (
    <div className="w-full h-fit flex flex-col items-center justify-end relative z-30 pointer-events-none pb-12">
      
      {/* Container flex para alinear notas horizontalmente en la parte inferior */}
      <div className="flex flex-wrap justify-center items-end gap-x-8 gap-y-12 pointer-events-auto">
        {notes.map((note) => (
          <StickyNote 
            key={note.id} 
            note={note} 
            onDelete={() => deleteNote(note.id)} 
            onChange={(text) => updateNoteText(note.id, text)} 
          />
        ))}

        {/* Botón Añadir (estilo glassmorphism) - Aparece al lado de las notas */}
        {notes.length < 6 && (
          <button 
            onClick={addNote}
            className="group flex flex-col items-center justify-center w-[180px] h-[180px] rounded-md bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-md transition-all duration-300 text-white/50 hover:text-white/90 cursor-pointer border-dashed outline-none"
          >
            <div className="p-3 rounded-full bg-black/20 group-hover:bg-black/40 transition-colors mb-2 shadow-inner">
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
            </div>
            <span className="text-[11px] font-medium tracking-[0.15em] uppercase">Añadir Nota</span>
          </button>
        )}
      </div>

    </div>
  );
}

function StickyNote({ 
  note, 
  onDelete, 
  onChange 
}: { 
  note: StickyNoteData, 
  onDelete: () => void, 
  onChange: (text: string) => void 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(note.text);
  const [isDeleting, setIsDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    onChange(text);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    setTimeout(onDelete, 300); // Dar 300ms a la animación css
  };

  return (
    <div 
      className={`group relative w-[180px] h-[180px] flex flex-col p-4 shadow-xl transition-all duration-300 ease-out origin-top 
        ${note.color} text-slate-800 backdrop-blur-sm
        ${isDeleting ? 'opacity-0 scale-95 translate-y-8 rotate-[15deg]' : 'opacity-100 scale-100 hover:scale-[1.03] hover:shadow-2xl hover:z-20 animate-[noteFadeIn_0.4s_ease-out]'}
      `}
      style={{ 
        transform: `rotate(${isDeleting ? note.rotation + 15 : note.rotation}deg)`,
        // Textura granular suave sutil usando SVG inline base64
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E")`
      }}
      onClick={() => !isEditing && setIsEditing(true)}
    >
      <style>{`
        @keyframes noteFadeIn {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0,0,0,0.1);
          border-radius: 4px;
        }
      `}</style>
      
      {/* Sombra interna superior para profundidad */}
      <div className="absolute top-0 left-0 w-full h-[10px] bg-gradient-to-b from-black/5 to-transparent pointer-events-none" />

      {/* Cinta Adhesiva (The Tape) */}
      <div 
        className={`absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 ${note.tapeColor} opacity-80 z-10 rotate-[-1deg] backdrop-blur-[2px]`}
        style={{
          boxShadow: '0 1px 2px rgba(0,0,0,0.1) inset, 0 2px 4px rgba(0,0,0,0.05)',
          borderTop: '1px solid rgba(255,255,255,0.4)',
          borderLeft: '1px solid rgba(255,255,255,0.2)',
        }}
      />

      {/* Botón Eliminar 'X' */}
      <button 
        onClick={handleDelete}
        className="absolute top-3 right-3 p-1 rounded-full bg-black/5 hover:bg-black/10 text-black/30 hover:text-black/70 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
        title="Eliminar nota"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Textarea / Div del Contenido Editable */}
      <div className="flex-1 mt-3 w-full h-full overflow-hidden flex flex-col relative z-10">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            className="w-full h-full bg-transparent border-none outline-none resize-none font-sans text-[12px] leading-relaxed text-black/80 placeholder-black/30 selection:bg-black/10 transition-colors custom-scrollbar"
            placeholder="Escribe tu idea..."
          />
        ) : (
          <div className="w-full h-full cursor-text font-sans text-[12px] leading-relaxed text-black/80 whitespace-pre-wrap break-words overflow-y-auto custom-scrollbar">
            {text || <span className="text-black/30 italic">Click para escribir...</span>}
          </div>
        )}
      </div>

      {/* Sombra de Pestaña inferior doblada */}
      <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl from-black/5 to-transparent pointer-events-none rounded-tl-full mix-blend-multiply opacity-50" />
    </div>
  );
}
