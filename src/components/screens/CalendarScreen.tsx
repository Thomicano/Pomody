import { CalendarDays } from "lucide-react";

export default function CalendarScreen() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto mt-4 px-4">
      <div className="w-[85vw] max-w-7xl h-[85vh] rounded-[32px] bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center gap-6">
        <div className="p-8 rounded-full bg-slate-50 border border-slate-200 shadow-sm">
          <CalendarDays size={56} className="text-cyan-500" />
        </div>
        <h2 className="text-3xl tracking-[0.2em] font-light text-slate-800 uppercase text-center px-4">Calendario Inteligente</h2>
        <p className="text-slate-500 text-sm tracking-widest uppercase font-light text-center px-4 max-w-lg leading-relaxed">
          Tu grilla mensual hiper-enfocada estará pronto disponible en Pomody Studio OS
        </p>
      </div>
    </div>
  );
}
