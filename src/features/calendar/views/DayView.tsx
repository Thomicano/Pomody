import React, { useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale'; 
import { useCalendarState } from '../context/CalendarContext';
import { EventBlock } from '../components/EventBlock';
import type { EventBase, ExtendedEvent } from '../types';
import { isAllDay } from '../utils';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function DayView({ events, onTimeSlotClick, onOpenPopover }: { events: EventBase[], onTimeSlotClick?: (start: string, end: string) => void, onOpenPopover?: (date: Date, rect: DOMRect, dayEvents: ExtendedEvent[]) => void }) {
  const { selectedDate, enrichEvents } = useCalendarState();
  const day = selectedDate;

  const enriched = useMemo(() => {
    return enrichEvents(events);
  }, [events, enrichEvents]);

  // Filtrado
  const dayEvents = enriched.filter(e => e.start_time && isSameDay(new Date(e.start_time), day) && !isAllDay(e.start_time, e.end_time));
  const allDayEvents = enriched.filter(e => e.start_time && isSameDay(new Date(e.start_time), day) && isAllDay(e.start_time, e.end_time));

  return (
    <div className="flex flex-col h-full bg-white/50 backdrop-blur-lg rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* HEADER: Día Selecto */}
      <div className="flex flex-col border-b border-slate-200 sticky top-0 bg-white/80 z-20">
        <div className="flex bg-white/90">
           <div className="w-[60px] flex items-center justify-center border-r border-slate-200 shrink-0">
             <span className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">GMT-3</span>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center p-3">
             <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mb-1">
               {format(day, 'EEEE', { locale: es })}
             </span>
             <span className={`text-xl font-semibold ${isSameDay(day, new Date()) ? 'text-cyan-600' : 'text-slate-700'}`}>
               {format(day, 'd MMMM', { locale: es })}
             </span>
           </div>
        </div>

        {/* CONTENEDOR ALL-DAY STICKY */}
        {allDayEvents.length > 0 && (
           <div className="flex border-t border-slate-100 bg-slate-50/50">
              <div className="w-[60px] border-r border-slate-200 flex items-center justify-center shrink-0">
                 <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">All Day</span>
              </div>
              <div className="flex-1 p-2 flex flex-wrap gap-1.5">
                 {allDayEvents.map(ev => (
                    <div key={ev.id} className="text-[10px] font-bold px-2 py-1 rounded-md border backdrop-blur-sm cursor-pointer shadow-sm truncate max-w-full"
                         style={{ backgroundColor: ev.colorBgHex, borderColor: ev.colorHex, color: ev.colorHex }}>
                       {ev.title}
                    </div>
                 ))}
              </div>
           </div>
        )}
      </div>

      {/* BODY: Grilla Vertical Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-[60px_1fr] relative" style={{ height: '1440px' }}>
          
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

          <div className="relative flex-1">
            <div className="absolute inset-0 pointer-events-none">
              {HOURS.map(hour => (
                <div 
                  key={hour} 
                  className="w-full border-b border-slate-200 absolute"
                  style={{ top: `${hour * 60}px` }}
                />
              ))}
            </div>

            <div className="relative h-full w-full">
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

              <div className="absolute inset-x-0 top-0 pointer-events-none z-10 w-full">
                {(() => {
                  const layouts = dayEvents.map((event, index) => {
                     let overlaps = 0;
                     for (let j = 0; j < index; j++) {
                        if (new Date(dayEvents[j].end_time).getTime() > new Date(event.start_time).getTime()) overlaps++;
                     }
                     const maxOverlaps = Math.min(overlaps, 6);
                     const leftOffset = maxOverlaps * 12; 
                     return { event, left: leftOffset, width: 88, zIndex: 10 + index };
                  });

                  const MAX_STAGGER = 3;
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
          </div>
        </div>
      </div>
    </div>
  );
}
