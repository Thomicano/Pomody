import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { X } from 'lucide-react';
import type { ExtendedEvent } from '../types';
import { EventBlock } from './EventBlock';
import { isAllDay } from '../utils';

interface DayFocusPopoverProps {
  date: Date;
  events: ExtendedEvent[];
  rect: DOMRect;
  onClose: () => void;
  onNewEvent: () => void;
}

export function DayFocusPopover({ date, events, rect, onClose, onNewEvent }: DayFocusPopoverProps) {
  // Ajuste matemático para que no se salga de pantalla (simplificado)
  const isLeft = rect.left > window.innerWidth / 2;
  const popupX = isLeft ? rect.left - 300 : rect.right + 10;
  const popupY = Math.min(rect.top, window.innerHeight - 400);

  return (
    <AnimatePresence>
      <motion.div 
         initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
         className="fixed inset-0 z-[160]"
         onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, x: isLeft ? 10 : -10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed w-72 bg-white/95 backdrop-blur-3xl shadow-2xl rounded-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[400px]"
          style={{ top: popupY, left: popupX }}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
             <div>
               <h3 className="text-sm font-bold text-slate-800 capitalize">
                 {format(date, 'EEEE d', { locale: es })}
               </h3>
               <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                 {format(date, 'MMMM yyyy', { locale: es })}
               </p>
             </div>
             <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
               <X size={14} strokeWidth={3} />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {events.length === 0 ? (
               <p className="text-xs text-slate-400 text-center py-6 font-medium">No hay eventos este día</p>
            ) : (
               events.map(event => {
                  const allDay = isAllDay(event.start_time, event.end_time);
                  return (
                    <div 
                      key={event.id}
                      className="relative rounded-xl border border-slate-100 overflow-hidden p-2 flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => console.log('Abrir UI de evento:', event.id)}
                    >
                       <div className="w-1.5 self-stretch rounded-full" style={{ backgroundColor: event.colorHex }} />
                       <div className="flex flex-col flex-1 truncate">
                          <span className="text-xs font-bold text-slate-800 truncate">{event.title}</span>
                          <span className="text-[10px] font-semibold text-slate-400">
                             {allDay ? 'Todo el día' : `${new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(event.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                          </span>
                       </div>
                    </div>
                  );
               })
            )}
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50">
            <button 
               onClick={onNewEvent}
               className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold tracking-wide transition-colors"
            >
               + NUEVO BLOQUE
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
