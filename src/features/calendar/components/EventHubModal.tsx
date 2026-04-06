
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Music, StickyNote, X, Tag } from 'lucide-react';
import type { ExtendedEvent } from '../types';

interface EventHubModalProps {
  event: ExtendedEvent;
  onClose: () => void;
  onStartPomodoro?: (id: string, title: string) => void;
}

export function EventHubModal({ event, onClose, onStartPomodoro }: EventHubModalProps) {
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 10 }}
          className="w-full max-w-sm bg-white/95 backdrop-blur-xl border border-white rounded-[24px] shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header Color Splash */}
          <div className="h-20 w-full relative" style={{ backgroundColor: event.colorBgHex }}>
            <div className="absolute top-4 right-4 bg-white/60 backdrop-blur-md rounded-full p-1.5 cursor-pointer hover:bg-white transition-colors text-slate-500 shadow-sm" onClick={onClose}>
              <X size={14} strokeWidth={3} />
            </div>
            <div className="absolute -bottom-6 left-6 w-14 h-14 rounded-2xl flex items-center justify-center border-[3px] border-white shadow-sm" style={{ backgroundColor: event.colorHex }}>
               <Tag size={20} className="text-white" />
            </div>
          </div>

          <div className="px-6 pt-10 pb-6">
            <div className="flex flex-col gap-1 mb-6">
               <span className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: event.colorHex }}>
                 {event.event_type}
               </span>
               <h2 className="text-xl font-bold text-slate-800 leading-tight block">
                 {event.title}
               </h2>
               <p className="text-xs text-slate-500 font-medium mt-1">
                 {new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(event.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
               </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
               <button className="flex flex-col items-center justify-center p-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-300 transition-colors group">
                 <StickyNote size={20} className="text-slate-400 group-hover:text-amber-500 mb-2 transition-colors" />
                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Notas Rápidas</span>
               </button>
               <button className="flex flex-col items-center justify-center p-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-300 transition-colors group">
                 <Music size={20} className="text-slate-400 group-hover:text-indigo-500 mb-2 transition-colors" />
                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Focus Music</span>
               </button>
            </div>

            <div className="w-full h-px bg-slate-100 mb-4" />

            <button 
               onClick={() => {
                 onStartPomodoro?.(event.id, event.title);
                 onClose();
               }}
               className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold tracking-widest text-xs uppercase shadow-md transition-all active:scale-[0.98]"
            >
               <Play size={14} className="fill-white" />
               Iniciar Pomodoro
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
