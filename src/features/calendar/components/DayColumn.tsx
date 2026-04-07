import React from 'react';
import { format } from 'date-fns';
import { EventBlock } from './EventBlock';
import { computeEventClusters } from './EventLayoutEngine';
import type { ExtendedEvent } from '../types';
import { useDroppable } from '@dnd-kit/core';

interface DayColumnProps {
  day: Date;
  dayEvents: ExtendedEvent[];
  isToday: boolean;
  onTimeSlotClick?: (start: string, end: string) => void;
  onDeleteEvent?: (id: string) => void;
  onOpenPopover?: (date: Date, rect: DOMRect, clusterEvents: ExtendedEvent[]) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const DayColumn: React.FC<DayColumnProps> = React.memo(({ day, dayEvents, isToday, onTimeSlotClick, onDeleteEvent, onOpenPopover }) => {
  const [nowMinute, setNowMinute] = React.useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  React.useEffect(() => {
    if (!isToday) return;
    const timer = setInterval(() => {
      const d = new Date();
      setNowMinute(d.getHours() * 60 + d.getMinutes());
    }, 60000);
    return () => clearInterval(timer);
  }, [isToday]);

  const clusters = React.useMemo(() => computeEventClusters(dayEvents, day), [dayEvents, day]);

  const dropId = format(day, 'yyyy-MM-dd');
  const { isOver, setNodeRef } = useDroppable({ id: dropId });

  return (
    <div 
       ref={setNodeRef} 
       className={`relative border-r border-slate-200 last:border-0 h-full transition-colors ${isOver ? 'bg-cyan-50/40 ring-inset ring-2 ring-cyan-200' : isToday ? 'bg-slate-50/50' : ''}`}
    >
      
      {/* TIME SLOTS (Clickables) */}
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

      {/* NOW LINE: Bajo la capa de eventos */}
      {isToday && (
         <div 
            className="absolute inset-x-0 border-b-2 border-red-500 z-10 pointer-events-none"
            style={{ top: `${nowMinute}px` }}
         >
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 absolute -left-1.5 -top-[5px] shadow-sm" />
         </div>
      )}

      {/* Background Guides & "Espacio libre" Empty State */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {HOURS.map(hour => (
          <React.Fragment key={hour}>
             <div 
               className="w-full border-b border-slate-200 absolute"
               style={{ top: `${hour * 60}px` }}
             />
             <div 
               className="w-full border-b border-dashed border-slate-200/60 absolute"
               style={{ top: `${(hour * 60) + 30}px` }}
             />
          </React.Fragment>
        ))}
        
        {clusters.length === 0 && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-slate-300/60 font-bold select-none text-sm -rotate-90 md:rotate-0 tracking-widest uppercase">
                 Espacio libre<br className="md:hidden"/> para estudiar
              </span>
           </div>
        )}
      </div> 

      {/* EVENT LAYER: Eventos posicionados según matriz del Engine */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {clusters.map(cluster => {
           // Límite de apilado: Si hay múltiples, permitimos hasta 2 visibles + un indicador de overflow (+X más)
           // 2 píldoras x 28px + gap = ~58px, que encaja perfecto en un bloque de 1 hora (60px)
           const visibleEvents = cluster.events.slice(0, 2);
           const hiddenCount = cluster.events.length - 2;

           return (
              <div 
                 key={cluster.id} 
                 className="absolute inset-x-0 mx-1 flex flex-col gap-[2px] pointer-events-none z-20"
                 style={{ top: `${cluster.topPx}px` }}
              >
                 {visibleEvents.map(event => (
                    <div className="pointer-events-auto h-[28px] w-full shrink-0" key={event.id}>
                       <EventBlock event={event} compact={false} onDelete={onDeleteEvent} solidPill={true} />
                    </div>
                 ))}
                 
                 {hiddenCount > 0 && (
                    <div 
                       className="pointer-events-auto h-[24px] bg-white/90 backdrop-blur-md rounded-md border border-slate-200 text-[10px] font-bold text-slate-600 flex items-center justify-center cursor-pointer shadow-sm hover:bg-slate-50 transition-colors w-full"
                       onClick={(e) => {
                          e.stopPropagation();
                          onOpenPopover?.(day, e.currentTarget.getBoundingClientRect(), cluster.events);
                       }}
                    >
                       +{hiddenCount} más
                    </div>
                 )}
              </div>
           );
        })}
      </div>

    </div>
  );
});
