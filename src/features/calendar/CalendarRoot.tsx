import { useState, useEffect, useMemo, useContext } from 'react';
import { CalendarProvider, CalendarContext, useCalendarState } from './context/CalendarContext';
import WeekView from './views/WeekView';
import MonthView from './views/MonthView';
import DayView from './views/DayView';
import { DayFocusPopover } from './components/DayFocusPopover';
import { useEvents } from './hooks/useEvents';
import { EventHubModal } from './components/EventHubModal';
import { NewEventForm } from './components/NewEventForm';
import type { ExtendedEvent } from './types';
import { Sparkles, Filter, Calendar as CalendarIcon, Plus, X, Tag, ChevronLeft, ChevronRight, Check, MoreVertical } from 'lucide-react';
import { addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, format, addMinutes, roundToNearestMinutes, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { DndContext, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { EventBlock } from './components/EventBlock';
import { CategoryGooglePopover } from './components/CategoryGooglePopover';
import { GOOGLE_CALENDAR_CATEGORY_PALETTE, defaultColorForCategoryIndex } from './constants/categoryPalette';

const SYSTEM_CATEGORIES = [
  { id: 'TAREA', label: 'Tareas', colorHex: '#3b82f6' },
  { id: 'EXAMEN', label: 'Exámenes', colorHex: '#ef4444' },
  { id: 'REPASO', label: 'Repasos', colorHex: '#10b981' },
] as const;

type SidebarRow =
  | { kind: 'system'; id: string; label: string; colorHex: string }
  | { kind: 'custom'; id: string; label: string; colorHex: string; dbId: string };

function CalendarOrchestrator({ onClose, onEventClick }: { onClose?: () => void; onEventClick?: (id: string) => void }) {
  const calendarCtx = useContext(CalendarContext);
  if (!calendarCtx) throw new Error('CalendarOrchestrator requiere CalendarProvider');

  const {
    currentView,
    setCurrentView,
    currentRange,
    selectedDate,
    setSelectedDate,
    setOnEventClick,
    selectedEvent,
    setSelectedEvent,
    filters,
    setFilters,
    enrichEvents,
    setCustomCategories,
  } = useCalendarState();

  const {
    fetchEvents,
    fetchCategories,
    isLoading,
    events,
    categories,
    deleteEvent,
    addCategory,
    updateCategory,
    deleteCategory,
    updateEvent,
  } = useEvents();

  const [newEventSlot, setNewEventSlot] = useState<{ start: string; end: string; isAllDay?: boolean } | null>(null);
  const [dayPopover, setDayPopover] = useState<{ date: Date; rect: DOMRect; events: ExtendedEvent[] } | null>(null);

  const [activeDragEvent, setActiveDragEvent] = useState<ExtendedEvent | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(GOOGLE_CALENDAR_CATEGORY_PALETTE[0]);
  const [menuRowId, setMenuRowId] = useState<string | null>(null);

  const sidebarRows: SidebarRow[] = useMemo(() => {
    const sys: SidebarRow[] = SYSTEM_CATEGORIES.map((c) => ({
      kind: 'system',
      id: c.id,
      label: c.label,
      colorHex: c.colorHex,
    }));
    const cust: SidebarRow[] = categories.map((c) => ({
      kind: 'custom',
      id: c.name,
      label: c.name,
      colorHex: c.color_hex,
      dbId: c.id,
    }));
    return [...sys, ...cust];
  }, [categories]);

  const hiddenSidebar = filters.sidebarHiddenIds ?? [];

  useEffect(() => {
    fetchEvents(currentRange.start, currentRange.end);
  }, [currentRange.start, currentRange.end, fetchEvents]);

  useEffect(() => {
    setCustomCategories(categories);
  }, [categories, setCustomCategories]);

  useEffect(() => {
    const onData = () => {
      fetchCategories();
      fetchEvents(currentRange.start, currentRange.end);
    };
    window.addEventListener('pomodyDataUpdate', onData);
    return () => window.removeEventListener('pomodyDataUpdate', onData);
  }, [fetchCategories, fetchEvents, currentRange.start, currentRange.end]);

  useEffect(() => {
    if (onEventClick) {
      setOnEventClick(() => onEventClick);
    } else {
      setOnEventClick(() => () => { });
    }
  }, [onEventClick, setOnEventClick]);

  const countForRow = (row: SidebarRow): number => {
    return events.filter((e) => e.event_type === row.id).length;
  };

  const handleDragStart = (e: { active: { id: string | number } }) => {
    const draggingEvent = enrichEvents(events).find((ev) => ev.id === e.active.id);
    if (draggingEvent) setActiveDragEvent(draggingEvent);
    setDayPopover(null);
  };


  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveDragEvent(null);
    const { active, over } = e;
    if (!over || !active) return;

    const targetDayIso = String(over.id);
    const eventToUpdate = events.find((ev) => ev.id === active.id);
    if (!eventToUpdate) return;

    const origStart = new Date(eventToUpdate.start_time);
    const origEnd = new Date(eventToUpdate.end_time);
    const durationMin = differenceInMinutes(origEnd, origStart);

    const transform = e.delta;
    const newStartMs = new Date(origStart.getTime() + transform.y * 60000);

    const dropDateParts = targetDayIso.split('-');
    if (dropDateParts.length === 3) {
      newStartMs.setFullYear(Number(dropDateParts[0]), Number(dropDateParts[1]) - 1, Number(dropDateParts[2]));
    }

    const snappedStart = roundToNearestMinutes(newStartMs, { nearestTo: 15 });
    const snappedEnd = addMinutes(snappedStart, durationMin);

    await updateEvent(eventToUpdate.id, {
      start_time: snappedStart.toISOString(),
      end_time: snappedEnd.toISOString(),
    });

    fetchEvents(currentRange.start, currentRange.end);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-[88vh] w-full max-w-[1400px] mx-auto bg-slate-50/50 backdrop-blur-xl border border-white/60 rounded-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden mt-6 relative z-10 pointer-events-auto">
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
                const end = new Date(start.getTime() + 60 * 60 * 1000);
                setNewEventSlot({ start: start.toISOString(), end: end.toISOString() });
              }}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 mt-3 px-4 py-2.5 rounded-xl shadow-sm transition-colors text-xs font-medium tracking-wide"
            >
              <Plus size={14} />
              Crear Evento
            </button>
          </div>

          <div className="flex-1 px-6 space-y-8 overflow-y-auto pb-6">
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
                <Sparkles size={12} className="text-indigo-400" />
                Asistente AI
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Usa el formato natural para coordinar repasos. Ej: &quot;Repaso de física el sábado&quot;
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
                    { id: 'day', label: 'Día' },
                  ] as const
                ).map((v) => (
                  <li key={v.id}>
                    <button
                      onClick={() => setCurrentView(v.id)}
                      className={`w-full text-left text-xs font-medium px-3 py-2 rounded-lg transition-colors ${currentView === v.id ? 'bg-cyan-50 text-cyan-700' : 'text-slate-600 hover:bg-slate-100/50'}`}
                    >
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
                  Categorías
                </h3>
                <button
                  onClick={() => setIsAddingCategory((prev) => !prev)}
                  className="p-1 hover:bg-slate-200 text-slate-500 rounded-md transition-colors"
                  title="Añadir categoría"
                  type="button"
                >
                  <Plus size={12} strokeWidth={3} />
                </button>

                {isAddingCategory && (
                  <div className="absolute top-full right-0 mt-1 w-52 bg-white border border-slate-200 shadow-xl rounded-xl p-3 z-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700">Nueva categoría</span>
                      <button type="button" onClick={() => setIsAddingCategory(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={12} />
                      </button>
                    </div>
                    <input
                      autoFocus
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      type="text"
                      placeholder="Ej: Física"
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md mb-2 outline-none focus:border-cyan-400 font-medium text-slate-900"
                    />
                    <div className="flex gap-1.5 mb-3 flex-wrap max-h-24 overflow-y-auto">
                      {GOOGLE_CALENDAR_CATEGORY_PALETTE.slice(0, 12).map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewCatColor(color)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 ${newCatColor === color ? 'border-slate-800' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        >
                          {newCatColor === color && <div className="w-1.5 h-1.5 bg-white rounded-full opacity-90" />}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (newCatName.trim()) {
                          const color = newCatColor || defaultColorForCategoryIndex(categories.length);
                          const res = await addCategory(newCatName.trim(), color);
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

              {hiddenSidebar.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, sidebarHiddenIds: [] })}
                  className="mb-2 text-[10px] font-semibold text-cyan-600 hover:underline"
                >
                  Mostrar categorías ocultas ({hiddenSidebar.length})
                </button>
              )}

              <ul className="space-y-0.5">
                {sidebarRows
                  .filter((row) => !hiddenSidebar.includes(row.id))
                  .map((row) => {
                    const dt = filters.disabledTypes ?? [];
                    const isDisabled = dt.includes(row.id);
                    const cnt = countForRow(row);

                    const menuOpen = menuRowId === row.id;

                    return (
                      <li key={row.id} className="relative group/cat">
                        <div
                          className="flex items-center justify-between w-full h-10 px-2 rounded-lg hover:bg-slate-100/50 transition-all duration-200"
                        >
                          {/* Grupo Izquierdo: Checkbox y Nombre */}
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              type="button"
                              title={isDisabled ? 'Mostrar en calendario' : 'Ocultar del calendario'}
                              onClick={() => {
                                if (isDisabled) {
                                  setFilters({ ...filters, disabledTypes: dt.filter((t) => t !== row.id) });
                                } else {
                                  setFilters({ ...filters, disabledTypes: [...dt, row.id] });
                                }
                              }}
                              className="shrink-0 flex h-4 w-4 items-center justify-center rounded-[3px] border border-black/10 shadow-sm transition-transform active:scale-90"
                              style={{ backgroundColor: isDisabled ? '#e2e8f0' : row.colorHex }}
                            >
                              {!isDisabled && <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (isDisabled) {
                                  setFilters({ ...filters, disabledTypes: dt.filter((t) => t !== row.id) });
                                } else {
                                  setFilters({ ...filters, disabledTypes: [...dt, row.id] });
                                }
                              }}
                              className={`min-w-0 text-left text-xs font-semibold truncate transition-colors ${isDisabled ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                            >
                              {row.label}
                            </button>
                          </div>

                          {/* Grupo Derecho: Contador e Icono */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className="text-slate-500 tabular-nums w-8 text-right pr-2 font-medium transition-colors"
                            >
                              {cnt}
                            </span>

                            <div className="relative flex items-center shrink-0">
                              <button
                                type="button"
                                title="Opciones"
                                onClick={() => setMenuRowId(menuOpen ? null : row.id)}
                                className={`p-1.5 rounded-md transition-colors ${menuOpen ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:bg-slate-200/80 hover:text-slate-600'}`}
                              >
                                <MoreVertical size={14} strokeWidth={2.5} />
                              </button>

                              <CategoryGooglePopover
                                open={menuOpen}
                                onClose={() => setMenuRowId(null)}
                                colorHex={row.colorHex}
                                showColorGrid={true}
                                onDisplayOnly={() => {
                                  const allIds = sidebarRows.map((r) => r.id);
                                  setFilters({
                                    ...filters,
                                    disabledTypes: allIds.filter((id) => id !== row.id),
                                  });
                                }}
                                onHideFromList={() => {
                                  const sh = filters.sidebarHiddenIds ?? [];
                                  if (!sh.includes(row.id)) {
                                    setFilters({ ...filters, sidebarHiddenIds: [...sh, row.id] });
                                  }
                                }}
                                onSettings={() => {
                                  if (row.kind === 'custom') {
                                    const n = window.prompt('Nombre de la categoría', row.label);
                                    if (n?.trim()) void updateCategory(row.dbId, { name: n.trim() });
                                  } else {
                                    window.alert('Los tipos de sistema (Tarea, Examen, Repaso) no se renombran desde aquí.');
                                  }
                                }}
                                onPickColor={(hex) => {
                                  if (row.kind === 'custom') {
                                    void updateCategory(row.dbId, { color_hex: hex });
                                  }
                                }}
                              />
                            </div>

                            {row.kind === 'custom' && (
                              <button
                                type="button"
                                title="Quitar categoría"
                                onClick={() => {
                                  if (confirm(`¿Eliminar categoría «${row.label}»? Los eventos conservarán la fecha.`)) {
                                    void deleteCategory(row.dbId);
                                  }
                                }}
                                className="shrink-0 p-1 rounded-md text-slate-300 opacity-0 group-hover/cat:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all"
                              >
                                <X size={12} strokeWidth={2.5} />
                              </button>
                            )}
                          </div>
                        </div>

                      </li>

                    );
                  })}
              </ul>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col relative overflow-hidden bg-[#fafafa]/80">
          <header className="px-6 py-4 border-b border-slate-200/50 flex justify-between items-center bg-white/60">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg shadow-sm p-1">
                <button
                  type="button"
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
                  type="button"
                  onClick={() => setSelectedDate(new Date())}
                  className="px-2 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded transition-colors uppercase tracking-wider"
                >
                  Hoy
                </button>
                <button
                  type="button"
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
                  {currentRange.start.toLocaleDateString('es', { month: 'short', day: 'numeric' })} -{' '}
                  {currentRange.end.toLocaleDateString('es', { month: 'short', day: 'numeric' })}
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
                <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100/80 text-slate-400 hover:text-slate-700 transition-colors">
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
                onDeleteEvent={async (id) => await deleteEvent(id)}
                onOpenPopover={(date, rect, dayEvents) => setDayPopover({ date, rect, events: dayEvents })}
              />
            )}
            {currentView === 'month' && (
              <MonthView events={events} onDayClick={(date, rect, dayEvents) => setDayPopover({ date, rect, events: dayEvents })} />
            )}
            {currentView === 'day' && (
              <DayView
                events={events}
                onTimeSlotClick={(start, end) => setNewEventSlot({ start, end })}
                onDeleteEvent={async (id) => await deleteEvent(id)}
                onOpenPopover={(date, rect, dayEvents) => setDayPopover({ date, rect, events: dayEvents })}
              />
            )}
          </section>

          {selectedEvent && (
            <EventHubModal
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
              onStartPomodoro={(id, title) => console.log('Iniciar pomodoro para', id, title)}
              onDeleteEvent={async (id) => {
                await deleteEvent(id);
                setSelectedEvent(null);
              }}
            />
          )}

          {newEventSlot && (
            <NewEventForm
              startTime={newEventSlot.start}
              endTime={newEventSlot.end}
              isInitialAllDay={newEventSlot.isAllDay}
              onClose={() => setNewEventSlot(null)}
              onSuccess={() => {
                setNewEventSlot(null);
                fetchEvents(currentRange.start, currentRange.end);
                fetchCategories();
                window.dispatchEvent(new Event('pomodyDataUpdate'));
              }}
              categories={categories}
            />
          )}

          {dayPopover && (
            <DayFocusPopover
              date={dayPopover.date}
              events={dayPopover.events.filter((e) => {
                const s = new Date(e.start_time);
                return s.getDate() === dayPopover.date.getDate() && s.getMonth() === dayPopover.date.getMonth();
              })}
              rect={dayPopover.rect}
              onClose={() => setDayPopover(null)}
              onNewEvent={() => {
                setDayPopover(null);
                const start = new Date(dayPopover.date);
                start.setHours(0, 0, 0, 0);
                const end = new Date(dayPopover.date);
                end.setHours(23, 59, 59, 999);
                setNewEventSlot({ start: start.toISOString(), end: end.toISOString(), isAllDay: true });
              }}
              onDeleteEvent={(id) => {
                deleteEvent(id);
              }}
            />
          )}

          <DragOverlay dropAnimation={{ duration: 120, easing: 'ease' }}>
            {activeDragEvent ? (
              <div
                className="pointer-events-none opacity-50 shrink-0 select-none overflow-hidden h-[28px] w-full max-w-[200px]"
                style={{ transform: 'none' }}
              >
                <EventBlock event={activeDragEvent} solidPill={true} />
              </div>
            ) : null}
          </DragOverlay>
        </main>
      </div>
    </DndContext>
  );
}

export default function CalendarRoot({ onClose, onEventClick }: { onClose?: () => void; onEventClick?: (id: string) => void }) {
  return (
    <CalendarProvider>
      <CalendarOrchestrator onClose={onClose} onEventClick={onEventClick} />
    </CalendarProvider>
  );
}
