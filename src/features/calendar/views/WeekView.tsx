import React, { useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale'; 
import { useCalendarState } from '../context/CalendarContext';
import { EventBlock } from '../components/EventBlock';
import type { EventBase, ExtendedEvent } from '../types';
import { isAllDay } from '../utils';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function WeekView({ events, onTimeSlotClick, onOpenPopover }: { events: EventBase[], onTimeSlotClick?: (start: string, end: string) => void, onOpenPopover?: (date: Date, rect: DOMRect, dayEvents: ExtendedEvent[]) => void }) {
  const { currentRange, enrichEvents } = useCalendarState();

  const daysOfWeek = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(currentRange.start, i));
  }, [currentRange.start]);

  const enriched = useMemo(() => {
    const res = enrichEvents(events);
    console.log('📌 [WeekView] Eventos enriquecidos en Context:', res);
    return res;
  }, [events, enrichEvents]);

  return (
    <div className="flex flex-col h-full bg-white/50 backdrop-blur-lg rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* HEADER: Columnas de Días */}
      <div className="grid grid-cols-[60px_1fr] border-b border-slate-200 sticky top-0 bg-white/80 z-20">
        <div className="flex items-center justify-center border-r border-slate-200">
          <span className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">GMT-3</span>
        </div>
        <div className="grid grid-cols-7">
          {daysOfWeek.map((day, i) => (
            <div 
              key={i} 
              className={`flex flex-col items-center justify-center p-3 border-r border-slate-200 last:border-0 ${isSameDay(day, new Date()) ? 'bg-cyan-50/50' : ''}`}
            >
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mb-1">
                {format(day, 'EEEE', { locale: es }).substring(0, 3)}
              </span>
              <span className={`text-lg font-semibold ${isSameDay(day, new Date()) ? 'text-cyan-600' : 'text-slate-700'}`}>
                {format(day, 'd')}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* CONTENEDOR ALL-DAY STICKY */}
      <div className="flex border-b border-slate-200 bg-slate-50/50 sticky top-[60px] z-20">
         <div className="w-[60px] border-r border-slate-200 shrink-0 flex items-center justify-center bg-white/50">
             <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">All Day</span>
         </div>
         <div className="grid grid-cols-7 flex-1">
             {daysOfWeek.map((day, i) => {
                 const allDayEvents = enriched.filter(e => e.start_time && isSameDay(new Date(e.start_time), day) && isAllDay(e.start_time, e.end_time));
                 return (
                     <div key={i} className="border-r border-slate-200 last:border-0 p-1 flex flex-col gap-1 min-h-[28px]">
                         {allDayEvents.map(ev => (
                            <div key={ev.id} className="text-[9px] font-bold px-1.5 py-0.5 rounded border shadow-sm truncate" style={{ backgroundColor: ev.colorBgHex, borderColor: ev.colorHex, color: ev.colorHex }}>{ev.title}</div>
                         ))}
                     </div>
                 );
             })}
         </div>
      </div>

      {/* BODY: Grilla Vertical Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Usamos 1440px fijos. 1 minuto = 1px */}
        <div className="grid grid-cols-[60px_1fr] relative" style={{ height: '1440px' }}>
          
          {/* Eje Y Horas */}
          <div className="relative border-r border-slate-200 bg-slate-50/40">
            {HOURS.map(hour => (
              <div 
                key={hour} 
                className="absolute w-full flex items-start justify-center text-[10px] text-slate-400 font-medium select-none"
                style={{ top: `${hour * 60}px`, transform: 'translateY(-50%)' }}
              >
                {hour === 0 ? '' : `${hour.toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {/* Grilla 7 Días */}
          <div className="grid grid-cols-7 relative">
            
            {/* Reglas Horizontales Guias */}
            <div className="absolute inset-0 pointer-events-none">
              {HOURS.map(hour => (
                <div 
                  key={hour} 
                  className="w-full border-b border-slate-200 absolute"
                  style={{ top: `${hour * 60}px` }}
                />
              ))}
            </div>

            {/* Columnas Día por Día */}
            {daysOfWeek.map((day, dayIndex) => {
              // Filtrado de eventos que caen dentro del día iterado Y NO son all_day
              const dayEvents = enriched.filter(e => {
                if (!e.start_time) return false;
                return isSameDay(new Date(e.start_time), day) && !isAllDay(e.start_time, e.end_time);
              });

              return (
                <div 
                  key={dayIndex} 
                  className={`relative border-r border-slate-200 last:border-0 ${isSameDay(day, new Date()) ? 'bg-cyan-50/10' : ''}`}
                >
                  {/* SLOTS INTERACTIVOS DE FONDO */}
                  <div className="absolute inset-x-0 top-0 flex flex-col z-0">
                    {HOURS.map(hour => {
                      const slotStart = new Date(day);
                      slotStart.setHours(hour, 0, 0, 0);
                      const slotEnd = new Date(day);
                      slotEnd.setHours(hour + 1, 0, 0, 0);
                      return (
                        <div 
                           key={hour} 
                           onClick={() => onTimeSlotClick?.(format(slotStart, "yyyy-MM-dd'T'HH:mm:ssXXX"), format(slotEnd, "yyyy-MM-dd'T'HH:mm:ssXXX"))}
                           className="h-[60px] w-full flex items-center justify-center opacity-0 hover:opacity-100 hover:bg-slate-200/40 cursor-pointer transition-colors border-b border-transparent group"
                        >
                            <span className="text-slate-400 font-bold text-lg pointer-events-none">+</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* EVENTOS RENDERIZADOS CON LÓGICA DE CLUSTERING (GOOGLE CALENDAR STYLE) */}
                  <div className="absolute inset-x-0 top-0 pointer-events-none z-10 w-full">
                    {(() => {
                      const layouts = dayEvents.map((event, index) => {
                         // Contar colisiones previas
                         let overlaps = 0;
                         for (let j = 0; j < index; j++) {
                            if (new Date(dayEvents[j].end_time).getTime() > new Date(event.start_time).getTime()) {
                               overlaps++;
                            }
                         }
                         
                         // Limitamos superposiciones visuales para no salirnos de la columna
                         const maxOverlaps = Math.min(overlaps, 6);
                         const leftOffset = maxOverlaps * 12; // 12% stagger escalonado
                         const width = 88; // 88% de ancho base para que sea legible

                         return { event, left: leftOffset, width, zIndex: 10 + index };
                      });

                     const MAX_STAGGER = 3;
                     // Solo renderizamos en cascada los que ocupen hasta un 3er nivel
                     const visibleLayouts = layouts.filter(lyt => (lyt.left / 12) < MAX_STAGGER);
                     const hasMore = layouts.length > visibleLayouts.length;

                     return (
                        <>
                          {visibleLayouts.map(lyt => (
                             <div 
                               key={lyt.event.id} 
                               className="pointer-events-auto absolute h-[0px] transition-all"
                               style={{ left: `${lyt.left}%`, width: `${lyt.width}%`, zIndex: lyt.zIndex }}
                             >
                               <EventBlock event={lyt.event as ExtendedEvent} />
                             </div>
                          ))}
                          {hasMore && (
                             <div className="absolute inset-x-1 bottom-4 h-6 z-50 pointer-events-auto flex items-center justify-center">
                                <button 
                                   onClick={(e) => onOpenPopover?.(day, e.currentTarget.getBoundingClientRect(), dayEvents as ExtendedEvent[])}
                                   className="px-3 py-1 bg-white/90 backdrop-blur-md shadow-md rounded-full text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                >
                                   +{layouts.length - visibleLayouts.length} más
                                </button>
                             </div>
                          )}
                        </>
                     );
                  })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
