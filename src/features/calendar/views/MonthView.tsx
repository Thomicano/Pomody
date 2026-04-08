import { useMemo } from 'react';
import { format, startOfMonth, startOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCalendarState } from '../context/CalendarContext';
import { useDroppable } from '@dnd-kit/core';
import { EventBlock } from '../components/EventBlock';
import type { EventBase } from '../types';
import { isEventInDay } from '../utils';

function MonthDayCell({ 
  day, 
  dayEvents, 
  isCurrentMonth, 
  isToday, 
  onDayClick 
}: { 
  day: Date; 
  dayEvents: any[]; 
  isCurrentMonth: boolean; 
  isToday: boolean; 
  onDayClick: (date: Date, rect: DOMRect, events: any[]) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: format(day, 'yyyy-MM-dd'),
    data: { type: 'DayCell', date: day }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`p-2 border-b border-r border-slate-200 last:border-r-0 relative group flex flex-col h-full min-h-[100px]
                 ${!isCurrentMonth ? 'bg-slate-50/50 opacity-60' : 'bg-white/40'}
                 ${isToday ? 'bg-cyan-50/30' : 'hover:bg-slate-50/80 cursor-pointer'} 
                 ${isOver ? 'ring-2 ring-inset ring-cyan-400 bg-cyan-50/50' : ''}
                 transition-all duration-200 overflow-hidden`}
      onClick={(e) => {
         onDayClick(day, e.currentTarget.getBoundingClientRect(), dayEvents);
      }}
    >
       <div className="flex flex-col h-full z-10">
         <span className={`self-start inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold transition-all
            ${isToday ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 group-hover:text-slate-900 group-hover:bg-slate-200/50'}`}>
           {format(day, 'd')}
         </span>
         <div className="mt-2 flex flex-col gap-1 px-0.5 pb-0.5 overflow-hidden flex-1">
           {dayEvents.slice(0, 3).map(event => (
              <div key={event.id} className="h-[22px] w-full shrink-0">
                <EventBlock event={event} solidPill={true} />
              </div>
           ))}
           {dayEvents.length > 3 && (
              <button 
                 type="button"
                 className="text-[9px] text-slate-500 font-bold ml-0.5 leading-none opacity-90 self-start mt-1 cursor-pointer hover:text-cyan-600 transition-colors bg-white/60 px-1.5 py-1 rounded border border-slate-100"
                 onClick={(e) => { e.stopPropagation(); onDayClick(day, e.currentTarget.getBoundingClientRect(), dayEvents); }}
              >
                 +{dayEvents.length - 3} más
              </button>
           )}
         </div>
       </div>
    </div>
  );
}


interface MonthViewProps {
  events: EventBase[];
  onDayClick: (date: Date, containerRect: DOMRect, dayEvents: any[]) => void;
}

export default function MonthView({ events, onDayClick }: MonthViewProps) {
  const { selectedDate, enrichEvents } = useCalendarState();

  const daysGrid = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    return Array.from({ length: 42 }).map((_, i) => addDays(startDate, i));
  }, [selectedDate]);

  const enriched = useMemo(() => enrichEvents(events), [events, enrichEvents]);

  return (
    <div className="flex flex-col h-full bg-white/50 backdrop-blur-lg rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-white/80">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="py-2.5 text-center text-[10px] font-bold text-slate-400 tracking-widest uppercase">
            {format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i), 'EEEE', { locale: es }).substring(0, 3)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6 flex-1">
        {daysGrid.map((day, i) => {
          const dayEvents = enriched.filter(e => e.start_time && e.end_time && isEventInDay(e.start_time, e.end_time, day));
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <MonthDayCell
              key={i}
              day={day}
              dayEvents={dayEvents}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday}
              onDayClick={onDayClick}
            />
          );
        })}

      </div>
    </div>
  );
}
