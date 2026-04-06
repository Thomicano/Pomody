import React, { useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale'; 
import { useCalendarState } from '../context/CalendarContext';
import { EventBlock } from '../components/EventBlock';
import type { EventBase } from '../types';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function WeekView({ events, onTimeSlotClick }: { events: EventBase[], onTimeSlotClick?: (start: string, end: string) => void }) {
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
              // Filtrado de eventos que caen dentro del día iterado
              const dayEvents = enriched.filter(e => {
                if (!e.start_time) return false;
                return isSameDay(new Date(e.start_time), day);
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
                      const layouts = dayEvents.map(event => ({ event, width: 100, left: 0 }));
                      
                      if (layouts.length > 0) {
                         let cluster = [layouts[0]];
                         let clusterEnd = new Date(layouts[0].event.end_time || layouts[0].event.start_time).getTime();

                         const processCluster = (cls: typeof layouts) => {
                            const cols: typeof layouts[] = [];
                            for (const item of cls) {
                               let placed = false;
                               const start = new Date(item.event.start_time).getTime();
                               for (let i = 0; i < cols.length; i++) {
                                  const lastInCol = cols[i][cols[i].length - 1];
                                  if (new Date(lastInCol.event.end_time || lastInCol.event.start_time).getTime() <= start) {
                                     cols[i].push(item);
                                     placed = true; 
                                     break;
                                  }
                               }
                               if (!placed) cols.push([item]);
                            }
                            const numCols = cols.length;
                            for (let c = 0; c < numCols; c++) {
                               for (const item of cols[c]) {
                                  item.width = 100 / numCols;
                                  item.left = c * (100 / numCols);
                               }
                            }
                         };

                         for (let i = 1; i < layouts.length; i++) {
                            const item = layouts[i];
                            const start = new Date(item.event.start_time).getTime();
                            const end = new Date(item.event.end_time || item.event.start_time).getTime();
                            if (start < clusterEnd) {
                               cluster.push(item);
                               clusterEnd = Math.max(clusterEnd, end);
                            } else {
                               processCluster(cluster);
                               cluster = [item];
                               clusterEnd = end;
                            }
                         }
                         processCluster(cluster);
                      }

                      return layouts.map(({ event, width, left }, index) => (
                        <div 
                          key={event.id} 
                          className="pointer-events-auto absolute h-[0px]"
                          style={{
                             left: `${left}%`,
                             width: `${width}%`,
                             zIndex: 10 + index
                          }}
                        >
                          <EventBlock event={event} />
                        </div>
                      ));
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
