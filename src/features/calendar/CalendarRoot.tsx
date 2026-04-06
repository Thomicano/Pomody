import { useEffect, useState } from 'react';
import { CalendarProvider, useCalendarState } from './context/CalendarContext';
import WeekView from './views/WeekView';
import MonthView from './views/MonthView';
import DayView from './views/DayView';
import { DayFocusPopover } from './components/DayFocusPopover';
import { useEvents } from './hooks/useEvents';
import { EventHubModal } from './components/EventHubModal';
import { NewEventForm } from './components/NewEventForm';
import type { ExtendedEvent } from './types';
import { Sparkles, Filter, Calendar as CalendarIcon, Plus, X, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';

function CalendarOrchestrator({ onClose, onEventClick }: { onClose?: () => void, onEventClick?: (id: string) => void }) {
  const { currentView, setCurrentView, currentRange, selectedDate, setSelectedDate, setOnEventClick, selectedEvent, setSelectedEvent, filters, setFilters } = useCalendarState();
  const { fetchEvents, isLoading, events, deleteEvent } = useEvents();
  const [newEventSlot, setNewEventSlot] = useState<{ start: string; end: string; isAllDay?: boolean } | null>(null);
  const [dayPopover, setDayPopover] = useState<{ date: Date; rect: DOMRect; events: ExtendedEvent[] } | null>(null);

  useEffect(() => {
    // Escucha pasivamente el estado global de rangos calculado en Context y delega la responsabilidad al Hook DB
    fetchEvents(currentRange.start, currentRange.end);
  }, [currentRange.start, currentRange.end, fetchEvents]);

  useEffect(() => {
    // Si hay un onEventClick global inyectado (ej para EventWorkspace), úsalo. Si no, usa nuestro HUB Modal
    if (onEventClick) {
         setOnEventClick(() => onEventClick);
    } else {
         setOnEventClick(() => () => {
             // Let calendar context manage it if needed
         });
    }
  }, [onEventClick, setOnEventClick]);

  return (
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
            <Plus size={14} />
            Nuevo Bloque
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
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
              <Tag size={12} />
              Categorías Activas
            </h3>
            <ul className="space-y-1">
              {(
                [
                  { id: 'TAREA', label: 'Tareas', color: 'bg-blue-500' },
                  { id: 'EXAMEN', label: 'Exámenes', color: 'bg-red-500' },
                  { id: 'REPASO', label: 'Repasos', color: 'bg-emerald-500' },
                  { id: 'OTRO', label: 'Otros', color: 'bg-slate-500' }
                ] as const
              ).map((v) => {
                 const isDisabled = filters.disabledTypes?.includes(v.id);
                 return (
                   <li key={v.id}>
                     <button 
                       onClick={() => {
                          const dt = filters.disabledTypes || [];
                          if (isDisabled) {
                             setFilters({ ...filters, disabledTypes: dt.filter(type => type !== v.id as any) });
                          } else {
                             setFilters({ ...filters, disabledTypes: [...dt, v.id as any] });
                          }
                       }}
                       className={`w-full flex items-center gap-2 text-left text-xs font-medium px-3 py-2 rounded-lg transition-colors ${!isDisabled ? 'text-slate-700 hover:bg-slate-100/50' : 'text-slate-400 hover:bg-slate-50'}`}>
                       <div className={`w-2 h-2 rounded-full ${isDisabled ? 'bg-slate-300' : v.color}`} />
                       <span className={isDisabled ? 'line-through opacity-60' : ''}>{v.label}</span>
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
                events={events} 
                onTimeSlotClick={(start, end) => setNewEventSlot({ start, end })} 
                onOpenPopover={(date, rect, dayEvents) => setDayPopover({ date, rect, events: dayEvents })}
             />
          )}
          {currentView === 'month' && (
             <MonthView 
                events={events}
                onDayClick={(date, rect, dayEvents) => setDayPopover({ date, rect, events: dayEvents })} 
             />
          )}
          {currentView === 'day' && (
             <DayView 
                events={events} 
                onTimeSlotClick={(start, end) => setNewEventSlot({ start, end })} 
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
          />
        )}
      </main>
    </div>
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
