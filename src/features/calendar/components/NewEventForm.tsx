import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { EventType } from '../types';
import { createEvent, getDefaultCalendar, supabase } from '@/lib/supabaseClient';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];
const EVENT_TYPES: { id: EventType, label: string }[] = [
  { id: 'TAREA', label: 'Tarea' },
  { id: 'EXAMEN', label: 'Parcial/Examen' },
  { id: 'REPASO', label: 'Repaso' },
  { id: 'OTRO', label: 'Otro' }
];

interface NewEventFormProps {
  startTime: string;
  endTime: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewEventForm({ startTime, endTime, onClose, onSuccess }: NewEventFormProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('TAREA');
  const [color, setColor] = useState('#3b82f6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startHour = new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endHour = new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No user");
      const calendar = await getDefaultCalendar();
      if (!calendar) throw new Error("No defaults found");

      await createEvent({
        calendar_id: calendar.id,
        user_id: session.user.id,
        title: title.trim(),
        description: '',
        start_time: startTime,
        end_time: endTime,
        event_type: type,
        color: color,
        all_day: false,
        is_completed: false
      });
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-center justify-center px-4 bg-black/20 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
          className="w-full max-w-sm bg-white/95 backdrop-blur-xl border border-white rounded-[24px] shadow-2xl p-6"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
             <h3 className="font-semibold text-slate-800">Nuevo Bloque</h3>
             <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={16} /></button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mb-1.5">Horario Central</p>
              <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-500 shadow-sm flex items-center justify-between">
                <span>{new Date(startTime).toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric'})}</span>
                <span className="text-slate-800 font-semibold">{startHour} - {endHour}</span>
              </div>
            </div>

            <div>
              <input 
                autoFocus required
                type="text" placeholder="Título del bloque..."
                className="w-full text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 px-4 py-3 bg-transparent shadow-sm border border-slate-200 focus:border-cyan-400 rounded-xl outline-none transition-colors"
                value={title} onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mb-2">Clasificación</p>
                 <select 
                   className="w-full text-xs font-medium px-3 py-2.5 bg-slate-50 border border-slate-200 shadow-sm focus:border-cyan-400 outline-none rounded-xl text-slate-600 appearance-none"
                   value={type} onChange={(e) => setType(e.target.value as EventType)}
                 >
                   {EVENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                 </select>
               </div>
               <div>
                 <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mb-2">Tag Estilo</p>
                 <div className="flex flex-wrap gap-1 mt-1">
                   {COLORS.map(c => (
                     <button
                       key={c} type="button" onClick={() => setColor(c)}
                       className={`w-[22px] h-[22px] rounded-full transition-transform ${color === c ? 'scale-125 shadow-sm ring-[2.5px] ring-offset-2 ring-slate-300' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                       style={{ backgroundColor: c }}
                     />
                   ))}
                 </div>
               </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
               <button type="button" onClick={onClose} className="flex-1 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-100 rounded-xl transition-colors">
                 Cancelar
               </button>
               <button type="submit" disabled={isSubmitting} className="flex-1 py-3 text-[11px] font-bold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-xl transition-colors uppercase tracking-widest shadow-md">
                 Crear
               </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
