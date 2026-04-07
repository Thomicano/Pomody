import React, { useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { isAllDay, isEventInDay } from '../utils';
import type { ExtendedEvent } from '../types';

interface CalendarGridProps {
  startDate: Date;
  daysCount: number;
  enrichedEvents: ExtendedEvent[];
  children: (day: Date, dayEvents: ExtendedEvent[], dayIndex: number) => React.ReactNode;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const CalendarGrid: React.FC<CalendarGridProps> = ({ startDate, daysCount, enrichedEvents, children }) => {
  const days = useMemo(() => {
    return Array.from({ length: daysCount }).map((_, i) => addDays(startDate, i));
  }, [startDate, daysCount]);

  return (
    <div className="flex flex-col h-full bg-white/50 backdrop-blur-lg rounded-[20px] border border-slate-200 overflow-hidden shadow-sm">
      
      {/* HEADER ROW */}
      <div className={`grid border-b border-slate-200 sticky top-0 bg-white/80 z-30 ${daysCount === 1 ? 'grid-cols-[60px_1fr]' : 'grid-cols-[60px_1fr]'}`}>
        <div className="flex items-center justify-center border-r border-slate-200 shrink-0">
          <span className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">GMT-3</span>
        </div>
        
        <div className={`grid ${daysCount === 1 ? 'grid-cols-1' : 'grid-cols-7'}`}>
          {days.map((day, i) => {
            const isToday = isSameDay(day, new Date());
            return (
              <div 
                key={i} 
                className={`flex flex-col items-center justify-center p-3 border-r border-slate-200 last:border-0 ${isToday ? 'bg-slate-50/50' : ''}`}
              >
                <span className={`text-[10px] font-medium uppercase tracking-widest mb-1 ${isToday ? 'text-cyan-600 font-bold' : 'text-slate-400'}`}>
                  {format(day, 'EEEE', { locale: es }).substring(0, 3)}
                </span>
                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold ${isToday ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-700'}`}>
                  {format(day, 'd')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STICKY ALL DAY BAR */}
      <div className="flex border-b border-slate-200 bg-slate-50/50 sticky top-[60px] z-30">
         <div className="w-[60px] border-r border-slate-200 shrink-0 flex items-center justify-center bg-white/50">
             <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">All Day</span>
         </div>
         <div className={`grid flex-1 ${daysCount === 1 ? 'grid-cols-1' : 'grid-cols-7'}`}>
             {days.map((day, i) => {
                 const allDayEvents = enrichedEvents.filter(e => e.start_time && e.end_time && isEventInDay(e.start_time, e.end_time, day) && isAllDay(e.start_time, e.end_time));
                 return (
                     <div key={i} className="border-r border-slate-200 last:border-0 p-1 flex flex-col gap-1 min-h-[28px]">
                         {allDayEvents.map(ev => (
                            <div key={ev.id} className="text-[9px] font-bold px-1.5 py-0.5 rounded border shadow-sm truncate w-full" style={{ backgroundColor: ev.colorBgHex, borderColor: ev.colorHex, color: ev.colorHex }}>{ev.title}</div>
                         ))}
                     </div>
                 );
             })}
         </div>
      </div>

      {/* SCROLLABLE BODY GRID */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-0">
        <div className={`grid grid-cols-[60px_1fr] relative`} style={{ height: '1440px' }}>
          
          {/* EJE Y (Horas) */}
          <div className="relative border-r border-slate-200 bg-slate-50/40 z-20">
            {HOURS.map(hour => (
              <div 
                key={hour} 
                className="absolute w-full flex items-start justify-center text-[10px] text-slate-500 font-bold select-none pr-1"
                style={{ top: `${hour * 60}px`, transform: 'translateY(-50%)' }}
              >
                {hour === 0 ? '' : `${hour.toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {/* BACKGROUND GUIDES & COLUMNS */}
          <div className="relative">
             {/* Reglas Horizontales Absolutas */}
             <div className="absolute inset-0 pointer-events-none z-0">
               {HOURS.map(hour => (
                 <React.Fragment key={hour}>
                   <div className="w-full border-b border-slate-200 absolute" style={{ top: `${hour * 60}px` }} />
                   <div className="w-full border-b border-dashed border-slate-200/60 absolute" style={{ top: `${(hour * 60) + 30}px` }} />
                 </React.Fragment>
               ))}
             </div>

             {/* DYNAMIC CONTENT COLUMNS */}
             <div className={`relative z-10 grid h-full ${daysCount === 1 ? 'grid-cols-1' : 'grid-cols-7'}`}>
               {days.map((day, dayIndex) => {
                  const dayEvents = enrichedEvents.filter(e => e.start_time && e.end_time && isEventInDay(e.start_time, e.end_time, day) && !isAllDay(e.start_time, e.end_time));
                  return children(day, dayEvents, dayIndex);
               })}
             </div>
          </div>

        </div>
      </div>

    </div>
  );
};
