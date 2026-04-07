import React, { useState, useEffect, useMemo } from 'react';
import { CalendarProvider, useCalendarState } from './context/CalendarContext';
import WeekView from './views/WeekView';
import MonthView from './views/MonthView';
import DayView from './views/DayView';
import { DayFocusPopover } from './components/DayFocusPopover';
import { useEvents } from './hooks/useEvents';
import { EventHubModal } from './components/EventHubModal';
import { NewEventForm } from './components/NewEventForm';
import type { ExtendedEvent } from './types';
import { Sparkles, Filter, Calendar as CalendarIcon, Plus, X, Tag, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, format, addMinutes, roundToNearestMinutes, startOfDay, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { DndContext, useSensor, useSensors, PointerSensor, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { EventBlock } from './components/EventBlock';

const SYSTEM_CATEGORIES = [
  { id: 'TAREA', label: 'Tareas', colorHex: '#3b82f6' },
  { id: 'EXAMEN', label: 'Exámenes', colorHex: '#ef4444' },
  { id: 'REPASO', label: 'Repasos', colorHex: '#10b981' },
];

function CalendarOrchestrator({ onClose, onEventClick }: { onClose?: () => void, onEventClick?: (id: string) => void }) {
  const { currentView, setCurrentView, currentRange, selectedDate, setSelectedDate, setOnEventClick, selectedEvent, setSelectedEvent, filters, setFilters, enrichEvents } = useCalendarState();
  const { fetchEvents, isLoading, events, categories, deleteEvent, addCategory, updateEvent } = useEvents();
  const [newEventSlot, setNewEventSlot] = useState<{ start: string; end: string; isAllDay?: boolean } | null>(null);
  const [dayPopover, setDayPopover] = useState<{ date: Date; rect: DOMRect; events: ExtendedEvent[] } | null>(null);

  // Drag & Drop
  const [activeDragEvent, setActiveDragEvent] = useState<ExtendedEvent | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // New Category State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#8b5cf6'); // Default purple
  
  const allCategories = [
    ...SYSTEM_CATEGORIES,
    ...categories.map(c => ({ id: c.name, label: c.name, colorHex: c.color_hex }))
  ];

  useEffect(() => {
    // Escucha pasivamente el estado global de rangos calculado en Context y delega la responsabilidad al Hook DB
    fetchEvents(currentRange.start, currentRange.end);
  }, [currentRange.start, currentRange.end, fetchEvents]);

  useEffect(() => {
    if (onEventClick) {
         setOnEventClick(() => onEventClick);
    } else {
         setOnEventClick(() => () => {});
    }
  }, [onEventClick, setOnEventClick]);

  // FIX: Pre-filtrar estrictamente eventos garantizando que no se filtren crudos a las vistas si la categoría está inactiva.
  const filteredEventsForGrid = useMemo(() => {
     return events.filter(e => {
        const dt = filters.disabledTypes || [];
        if (dt.includes(e.event_type)) return false;
        
        // Match permisivo por si el event_type guardó el label crudo en vez del ID
        const cat = allCategories.find(c => c.id === e.event_type || c.label === e.event_type);
        if (cat && dt.includes(cat.id)) return false;
        
        return true;
     });
  }, [events, filters.disabledTypes, allCategories]);

  const handleDragStart = (e: any) => {
     const draggingEvent = enrichEvents(events).find(ev => ev.id === e.active.id);
     if (draggingEvent) setActiveDragEvent(draggingEvent);
     setDayPopover(null); // Fix: close the popover whenever the user drags anything
  };

  const handleDragEnd = async (e: DragEndEvent) => {
     setActiveDragEvent(null);
     const { active, over } = e;
     if (!over || !active) return;
     
     // El over.id debería contener un date ISO del DayColumn, o algo que lo identifique.
     // DayColumn expondrá useDroppable con id={format(day, 'yyyy-MM-dd')}
     const targetDayIso = String(over.id);
     
     const eventToUpdate = events.find(ev => ev.id === active.id);
     if (!eventToUpdate) return;
     
     const origStart = new Date(eventToUpdate.start_time);
     const origEnd = new Date(eventToUpdate.end_time);
     const durationMin = differenceInMinutes(origEnd, origStart);
     
     // Extraer las coordenadas Y del drop para mapear a la hora sin descarte
     const transform = e.delta; // pixel change on Y. Each hour = 60px -> 1px = 1min
     const newStartMs = new Date(origStart.getTime() + transform.y * 60000);
     
     // FIX: Parsear sin zona horaria destructiva. Evita reset de horas y desfase de dias a fin de mes.
     const dropDateParts = targetDayIso.split('-');
     if (dropDateParts.length === 3) {
        newStartMs.setFullYear(Number(dropDateParts[0]), Number(dropDateParts[1]) - 1, Number(dropDateParts[2]));
     }
     
     // Snap-To-Grid (Round to nearest 15 mins)
     const snappedStart = roundToNearestMinutes(newStartMs, { nearestTo: 15 });
     const snappedEnd = addMinutes(snappedStart, durationMin);
     
     // Update via hook
     await updateEvent(eventToUpdate.id, {
        start_time: snappedStart.toISOString(),
        end_time: snappedEnd.toISOString()
     });
     
     fetchEvents(currentRange.start, currentRange.end); // optimistic refresh
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    <div className="flex h-[88vh] w-full max-w-[1400px] mx-auto bg-slate-50/50 backdrop-blur-xl border border-white/60 rounded-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden mt-6 relative z-10 pointer-events-auto">
      
      {/* SIDEBAR (Panel Control / IA) */}
      <aside className="w-64 border-r border-slate-200/50 bg-white/40 hidden md:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-100 text-cyan-600 shadow-sm border border-white">
              <CalendarIcon size={16} />
            </div>
            <h1 className="text-sm font-semibold text-slate-800 tracking-wider">Study Hub</h1>
          </div>

          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-omnibar'));
            }}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl shadow-md transition-colors text-xs font-medium tracking-wide"
          >
            <Sparkles size={14} />
            Nuevo Bloque (AI)
          </button>
          
          <button 
             onClick={() => {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);
                const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 Hour
                setNewEventSlot({ start: start.toISOString(), end: end.toISOString() });
             }}
             className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 mt-3 px-4 py-2.5 rounded-xl shadow-sm transition-colors text-xs font-medium tracking-wide"
          >
             <Plus size={14} />
             Crear Evento
          </button>
        </div>

        <div className="flex-1 px-6 space-y-8">
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles size={12} className="text-indigo-400" />
              Asistente AI
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Usa el formato natural para coordinar repasos con Llama 3. Ej: "Repaso de física el sábado"
            </p>
          </div>

          <div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
              <Filter size={12} />
              Vistas
            </h3>
            <ul className="space-y-1">
              {(
                [
                  { id: 'month', label: 'Mes' },
                  { id: 'week', label: 'Semana' },
                  { id: 'day', label: 'Día' }
                ] as const
              ).map((v) => (
                <li key={v.id}>
                  <button 
                    onClick={() => setCurrentView(v.id)}
                    className={`w-full text-left text-xs font-medium px-3 py-2 rounded-lg transition-colors ${currentView === v.id ? 'bg-cyan-50 text-cyan-700' : 'text-slate-600 hover:bg-slate-100/50'}`}>
                    {v.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3 relative">
               <h3 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-400 flex items-center gap-1.5">
                 <Tag size={12} />
                 Categorías Activas
               </h3>
               <button onClick={() => setIsAddingCategory(prev => !prev)} className="p-1 hover:bg-slate-200 text-slate-500 rounded-md transition-colors" title="Añadir Categoría">
                 <Plus size={12} strokeWidth={3} />
               </button>

               {/* Popover Crear Categoría */}
               {isAddingCategory && (
                 <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 shadow-xl rounded-xl p-3 z-50">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-xs font-bold text-slate-700">Nueva Categoría</span>
                       <button onClick={() => setIsAddingCategory(false)} className="text-slate-400 hover:text-slate-600"><X size={12}/></button>
                    </div>
                    <input autoFocus value={newCatName} onChange={e => setNewCatName(e.target.value)} type="text" placeholder="Ej: Tesis" className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md mb-2 outline-none focus:border-cyan-400 font-medium" />
                    <div className="flex gap-1.5 mb-3 flex-wrap">
                       {['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#f43f5e'].map(color => (
                          <button key={color} onClick={() => setNewCatColor(color)} className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 ${newCatColor === color ? 'border-slate-800' : 'border-transparent'}`} style={{ backgroundColor: color }}>
                             {newCatColor === color && <div className="w-1.5 h-1.5 bg-white rounded-full opacity-80"/>}
                          </button>
                       ))}
                    </div>
                    <button 
                       onClick={async () => {
                          if (newCatName.trim()) {
                             const res = await addCategory(newCatName.trim(), newCatColor);
                             if (res) setIsAddingCategory(false);
                             setNewCatName('');
                          }
                       }}
                       disabled={!newCatName.trim()}
                       className="w-full bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md disabled:opacity-50"
                    >
                       Añadir
                    </button>
                 </div>
               )}
            </div>
            
            <ul className="space-y-1">
              {allCategories.map((v) => {
                 const isDisabled = filters.disabledTypes?.includes(v.id);
                 const count = events.filter(e => e.event_type === v.id || e.event_type === v.label).length; // match enum or un-strict custom label
                 return (
                   <li key={v.id}>
                     <button 
                       onClick={() => {
                          const dt = filters.disabledTypes || [];
                          if (isDisabled) {
                             setFilters({ ...filters, disabledTypes: dt.filter(type => type !== v.id) });
                          } else {
                             setFilters({ ...filters, disabledTypes: [...dt, v.id] });
                          }
                       }}
                       className={`w-full flex items-center justify-between text-left text-xs font-medium px-3 py-2 rounded-lg transition-colors group ${!isDisabled ? 'text-slate-700 hover:bg-slate-100/50' : 'text-slate-400 hover:bg-slate-50'}`}>
                       
                       <div className={`flex items-center gap-2 overflow-hidden ${isDisabled ? 'opacity-40' : ''}`}>
                          <div className="w-2 h-2 shrink-0 rounded-full transition-colors" style={{ backgroundColor: isDisabled ? '#cbd5e1' : v.colorHex }} />
                          <span className={`truncate ${isDisabled ? 'line-through' : ''}`}>{v.label}</span>
                       </div>
                       
                       <span className={`text-[10px] font-bold py-0.5 px-1.5 rounded-full transition-colors ${!isDisabled ? 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm' : 'bg-transparent text-slate-300'}`}>
                          {count}
                       </span>
                     </button>
                   </li>
                 );
              })}
            </ul>
          </div>
        </div>
      </aside>

      {/* CORE CANVAS */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#fafafa]/80">
        <header className="px-6 py-4 border-b border-slate-200/50 flex justify-between items-center bg-white/60">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg shadow-sm p-1">
                <button 
                   onClick={() => {
                      if (currentView === 'day') setSelectedDate(subDays(selectedDate, 1));
                      else if (currentView === 'week') setSelectedDate(subWeeks(selectedDate, 1));
                      else if (currentView === 'month') setSelectedDate(subMonths(selectedDate, 1));
                   }}
                   className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                >
                   <ChevronLeft size={16} />
                </button>
                <button 
                   onClick={() => setSelectedDate(new Date())}
                   className="px-2 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded transition-colors uppercase tracking-wider"
                >
                   Hoy
                </button>
                <button 
                   onClick={() => {
                      if (currentView === 'day') setSelectedDate(addDays(selectedDate, 1));
                      else if (currentView === 'week') setSelectedDate(addWeeks(selectedDate, 1));
                      else if (currentView === 'month') setSelectedDate(addMonths(selectedDate, 1));
                   }}
                   className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                >
                   <ChevronRight size={16} />
                </button>
             </div>
             
             <h2 className="text-lg font-semibold text-slate-800 hidden sm:block capitalize">
               {currentView === 'month' 
                 ? format(selectedDate, 'MMMM yyyy', { locale: es })
                 : currentView === 'day'
                 ? format(selectedDate, "d 'de' MMMM", { locale: es })
                 : 'Esta Semana'}
             </h2>
             
             {currentView === 'week' && (
                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md border border-slate-200 font-medium">
                  {currentRange.start.toLocaleDateString('es', { month: 'short', day: 'numeric' })} - {currentRange.end.toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                </span>
             )}
          </div>
          
          <div className="flex items-center gap-3">
             {isLoading && (
                <div className="text-[10px] text-cyan-500 font-medium flex items-center gap-1.5 animate-pulse">
                  Construyendo Hub...
                </div>
             )}
             {onClose && (
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100/80 text-slate-400 hover:text-slate-700 transition-colors">
                  <X size={18} />
                </button>
             )}
          </div>
        </header>

        <section className="flex-1 p-4 pb-0 overflow-hidden relative">
          {currentView === 'week' && (
             <WeekView 
                events={filteredEventsForGrid} 
                onTimeSlotClick={(start, end) => setNewEventSlot({ start, end })} 
                onDeleteEvent={async (id) => await deleteEvent(id)}
                onOpenPopover={(date, rect, dayEvents) => setDayPopover({ date, rect, events: dayEvents })}
             />
          )}
          {currentView === 'month' && (
             <MonthView 
                events={filteredEventsForGrid}
                onDayClick={(date, rect, dayEvents) => setDayPopover({ date, rect, events: dayEvents })} 
             />
          )}
          {currentView === 'day' && (
             <DayView 
                events={filteredEventsForGrid} 
                onTimeSlotClick={(start, end) => setNewEventSlot({ start, end })} 
                onDeleteEvent={async (id) => await deleteEvent(id)}
                onOpenPopover={(date, rect, dayEvents) => setDayPopover({ date, rect, events: dayEvents })}
             />
          )}
        </section>

        {/* MODAL 1: HUB EVENTO SELECCIONADO */}
        {selectedEvent && (
          <EventHubModal 
             event={selectedEvent} 
             onClose={() => setSelectedEvent(null)}
             onStartPomodoro={(id, title) => console.log('Iniciar pomodoro para', id, title)}
             onDeleteEvent={async (id) => {
                await deleteEvent(id);
                setSelectedEvent(null);
                // The optimistic update in useEvents removes it from `events` automatically.
             }}
          />
        )}

        {/* MODAL 2: CREACIÓN NUEVO EVENTO GRID */}
        {newEventSlot && (
          <NewEventForm 
             startTime={newEventSlot.start} 
             endTime={newEventSlot.end}
             isInitialAllDay={newEventSlot.isAllDay}
             onClose={() => setNewEventSlot(null)}
             onSuccess={() => {
                setNewEventSlot(null);
                fetchEvents(currentRange.start, currentRange.end);
                window.dispatchEvent(new Event("pomodyDataUpdate"));
             }}
          />
        )}

        {/* POPOVER: AGRUPACIÓN DIARIA MULTIVISTA */}
        {dayPopover && (
          <DayFocusPopover 
             date={dayPopover.date}
             events={dayPopover.events.filter(e => {
                const s = new Date(e.start_time);
                return s.getDate() === dayPopover.date.getDate() && s.getMonth() === dayPopover.date.getMonth();
             })}
             rect={dayPopover.rect}
             onClose={() => setDayPopover(null)}
             onNewEvent={() => {
                setDayPopover(null);
                const start = new Date(dayPopover.date); start.setHours(0,0,0,0);
                const end = new Date(dayPopover.date); end.setHours(23,59,59,999);
                setNewEventSlot({ start: start.toISOString(), end: end.toISOString(), isAllDay: true });
             }}
             onDeleteEvent={(id) => {
                deleteEvent(id);
                // Si preferimos conservar el popover abierto podemos no cerrarlo, la UI del calendario es reactiva
             }}
          />
        )}
        {/* DRAG OVERLAY GHOST */}
        <DragOverlay dropAnimation={defaultDropAnimationSideEffects({ duration: 50 })}>
           {activeDragEvent ? (
              <div className="pointer-events-none opacity-50 shrink-0 select-none overflow-hidden h-[28px] w-full max-w-[200px]" style={{ transform: 'none' }}>
                 <EventBlock event={activeDragEvent} solidPill={true} />
              </div>
           ) : null}
        </DragOverlay>

      </main>
    </div>
    </DndContext>
  );
}

// Envuelve en Provider aislando contexto global
export default function CalendarRoot({ onClose, onEventClick }: { onClose?: () => void, onEventClick?: (id: string) => void }) {
  return (
    <CalendarProvider>
      <CalendarOrchestrator onClose={onClose} onEventClick={onEventClick} />
    </CalendarProvider>
  );
}
