import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock, CalendarDays, LayoutGrid, List, X, CheckSquare, Square, ChevronLast, ChevronFirst } from "lucide-react";
import {
  fetchUserEvents,
  fetchUserTasks,
  updateTask,
  createEvent,
  getDefaultCalendar,
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
  type PomodyEvent,
  type PomodyTask,
  type EventType,
  supabase
} from "@/lib/supabaseClient";

type CalendarView = "week" | "month" | "day";

const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DAYS_FULL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 06:00 → 23:00
// ── Date helpers ──
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getDaysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

function getFirstDayOfMonth(y: number, m: number) {
  const d = new Date(y, m, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// ── Mock events for demo ──
function generateMockEvents(): PomodyEvent[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const make = (dayOffset: number, hourStart: number, hourEnd: number, title: string, type: EventType): PomodyEvent => {
    const start = new Date(today);
    start.setDate(start.getDate() + dayOffset);
    start.setHours(hourStart, 0, 0, 0);
    const end = new Date(start);
    end.setHours(hourEnd, 0, 0, 0);

    return {
      id: `mock-${dayOffset}-${hourStart}`,
      calendar_id: "default",
      user_id: "demo",
      title,
      description: "",
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      event_type: type,
      color: EVENT_TYPE_COLORS[type],
      all_day: false,
      is_completed: false,
      created_at: new Date().toISOString(),
    };
  };

  return [
    make(0, 9, 11, "Repaso Álgebra Lineal", "REPASO"),
    make(0, 14, 15, "TP Programación", "TAREA"),
    make(1, 10, 12, "Parcial Física II", "EXAMEN"),
    make(2, 16, 17, "Práctica Cálculo", "REPASO"),
    make(3, 8, 10, "Entrega Informe Lab", "TAREA"),
    make(-1, 11, 13, "Estudio Libre", "OTRO"),
  ];
}

interface CalendarScreenProps {
  onEventClick?: (eventId: string) => void;
  onClose?: () => void;
}

export default function CalendarScreen({ onEventClick, onClose }: CalendarScreenProps) {
  const today = new Date();
  const [view, setView] = useState<CalendarView>("week");
  const [currentDate, setCurrentDate] = useState(today);
  const [events, setEvents] = useState<PomodyEvent[]>([]);
  const [tasks, setTasks] = useState<PomodyTask[]>([]);
  const [isTasksOpen, setIsTasksOpen] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventType, setNewEventType] = useState<EventType>("OTRO");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setRefreshTick(prev => prev + 1);
    window.addEventListener("pomodyDataUpdate", handleUpdate);
    return () => window.removeEventListener("pomodyDataUpdate", handleUpdate);
  }, []);

  // Fetch events and tasks
  useEffect(() => {
    const loadData = async () => {
      const [eventsData, tasksData] = await Promise.all([
        fetchUserEvents(),
        fetchUserTasks()
      ]);
      if (eventsData.length === 0) setEvents(generateMockEvents());
      else setEvents(eventsData);
      setTasks(tasksData);
    };
    loadData();
  }, [refreshTick, currentDate]);

  const toggleTaskStatus = async (taskId: string, is_completed: boolean) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: !is_completed } : t));
    await updateTask(taskId, { is_completed: !is_completed });
  };

  // Week range
  const weekStart = useMemo(() => getMonday(currentDate), [currentDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventTime || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("No user");

      const calendar = await getDefaultCalendar();
      if (!calendar) throw new Error("No calendar");

      const targetDate = new Date(currentDate);
      const [h, m] = newEventTime.split(":").map(Number);
      targetDate.setHours(h, m, 0, 0);

      const endTime = new Date(targetDate.getTime() + 60 * 60 * 1000); // 1hr later

      await createEvent({
        calendar_id: calendar.id,
        user_id: session.user.id,
        title: newEventTitle,
        description: "",
        start_time: targetDate.toISOString(),
        end_time: endTime.toISOString(),
        event_type: newEventType,
        color: EVENT_TYPE_COLORS[newEventType],
        all_day: false,
        is_completed: false,
      });

      window.dispatchEvent(new Event("pomodyDataUpdate"));
      setIsAddingEvent(false);
      setNewEventTitle("");
      setNewEventTime("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation
  const goToday = () => setCurrentDate(new Date());
  const goPrev = () => {
    if (view === "week") setCurrentDate(addDays(currentDate, -7));
    else if (view === "month") setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    else setCurrentDate(addDays(currentDate, -1));
  };
  const goNext = () => {
    if (view === "week") setCurrentDate(addDays(currentDate, 7));
    else if (view === "month") setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const VIEW_ICONS: { id: CalendarView; icon: any; label: string }[] = [
    { id: "month", icon: LayoutGrid, label: "Mes" },
    { id: "week", icon: CalendarDays, label: "Semana" },
    { id: "day", icon: List, label: "Día" },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto mt-4 px-4 z-[80]">
      <div className="w-full max-w-5xl h-[85vh] bg-white/85 backdrop-blur-xl border border-white/60 rounded-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden relative">

        {/* ═══ HEADER ═══ */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-200/50">
          <div className="flex items-center gap-4">
            {onClose && (
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100/80 text-slate-400 hover:text-slate-700 transition-colors">
                <X size={18} />
              </button>
            )}
            <h2 className="text-lg font-light text-slate-800 tracking-tight">
              {view === "day"
                ? `${DAYS_FULL[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1]} ${currentDate.getDate()}`
                : `${MONTHS_ES[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={goPrev} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button onClick={goToday} className="px-2.5 py-1 text-[9px] uppercase tracking-widest text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors font-medium">
                Hoy
              </button>
              <button onClick={goNext} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <div className="flex bg-slate-100/80 rounded-xl p-0.5 gap-0.5">
              {VIEW_ICONS.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-widest transition-all ${
                    view === id
                      ? "bg-white text-slate-800 shadow-sm font-medium"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setIsTasksOpen(!isTasksOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] uppercase tracking-widest font-medium transition-all ${isTasksOpen ? 'bg-indigo-50 text-indigo-500 hover:bg-indigo-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              Tareas
              {isTasksOpen ? <ChevronLast size={12} /> : <ChevronFirst size={12} />}
            </button>
            <button 
              onClick={() => setIsAddingEvent(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-[9px] uppercase tracking-widest font-medium transition-colors shadow-sm"
            >
              <Plus size={12} />
              Evento
            </button>
          </div>
        </div>

        {isAddingEvent && (
          <div className="absolute top-16 right-6 z-50 bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-4 w-72 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Nuevo Evento</h3>
              <button onClick={() => setIsAddingEvent(false)} className="text-slate-400 hover:text-slate-700">
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleAddEvent} className="flex flex-col gap-3">
              <input 
                autoFocus
                type="text" 
                placeholder="Título del evento"
                className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-cyan-400 transition-colors"
                value={newEventTitle}
                onChange={e => setNewEventTitle(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <input 
                  type="time" 
                  className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-cyan-400 transition-colors"
                  value={newEventTime}
                  onChange={e => setNewEventTime(e.target.value)}
                  required
                />
                <select 
                  className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 outline-none focus:border-cyan-400 transition-colors"
                  value={newEventType}
                  onChange={e => setNewEventType(e.target.value as EventType)}
                >
                  {Object.entries(EVENT_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full mt-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg py-2 text-xs uppercase tracking-wider font-semibold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Guardando..." : "Guardar"}
              </button>
            </form>
          </div>
        )}

        {/* ═══ CONTENT ═══ */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Calendar Area */}
          <div className="flex-1 overflow-hidden">
            {view === "week" && (
              <WeekView events={events} weekDays={weekDays} today={today} onEventClick={onEventClick} />
            )}
            {view === "month" && (
              <MonthView
                events={events}
                currentDate={currentDate}
                today={today}
                onDayClick={(d) => { setCurrentDate(d); setView("week"); }}
                onEventClick={onEventClick}
              />
            )}
            {view === "day" && (
              <DayView events={events} currentDate={currentDate} today={today} onEventClick={onEventClick} />
            )}
          </div>

          {/* Tasks Sidebar */}
          <div 
            className={`flex flex-col border-l border-slate-100 transition-all duration-300 ease-in-out ${
              isTasksOpen ? 'w-64 opacity-100 visible' : 'w-0 border-l-0 opacity-0 invisible'
            }`}
          >
            <div className="p-4 bg-slate-50/50 flex-1 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <CheckSquare size={13} className="text-slate-400" />
                <h3 className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">Pendientes</h3>
              </div>
              
              {tasks.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-[10px] text-slate-400 tracking-wider">No hay tareas pendientes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div key={task.id} className="flex items-start gap-2 bg-white rounded-lg p-3 border border-slate-100 shadow-sm transition-all hover:border-slate-200">
                      <button 
                        onClick={() => toggleTaskStatus(task.id, task.is_completed)}
                        className="mt-0.5 text-slate-400 hover:text-cyan-500 transition-colors"
                      >
                        {task.is_completed ? <CheckSquare size={14} className="text-emerald-500" /> : <Square size={14} />}
                      </button>
                      <span className={`text-[11px] font-medium flex-1 pt-0.5 leading-snug ${task.is_completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// WEEK VIEW (Principal)
// ═══════════════════════════════════════════════════════════
function WeekView({
  events, weekDays, today, onEventClick,
}: {
  events: PomodyEvent[];
  weekDays: Date[];
  today: Date;
  onEventClick?: (id: string) => void;
}) {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Time gutter */}
      <div className="w-14 flex-shrink-0 border-r border-slate-100 pt-10">
        {HOURS.map((h) => (
          <div key={h} className="h-14 flex items-start justify-end pr-2 -mt-2">
            <span className="text-[9px] text-slate-300 tabular-nums">
              {String(h).padStart(2, "0")}:00
            </span>
          </div>
        ))}
      </div>

      {/* Day columns */}
      <div className="flex-1 flex overflow-hidden">
        {weekDays.map((day, di) => {
          const isToday = isSameDay(day, today);
          const dayEvents = events.filter((e) => {
            const eDate = new Date(e.start_time);
            return isSameDay(eDate, day);
          });

          return (
            <div key={di} className="flex-1 flex flex-col min-w-0 border-r border-slate-100/60 last:border-r-0">
              {/* Day header */}
              <div className={`py-2 text-center border-b border-slate-100/60 sticky top-0 bg-white/90 backdrop-blur-sm z-10 ${isToday ? 'bg-cyan-50/60' : ''}`}>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest">{DAYS_ES[di]}</p>
                <p className={`text-lg font-light mt-0.5 ${isToday ? 'text-cyan-600 font-medium' : 'text-slate-700'}`}>
                  {day.getDate()}
                </p>
              </div>

              {/* Hour cells */}
              <div className="flex-1 relative overflow-y-auto">
                {HOURS.map((h) => (
                  <div key={h} className={`h-14 border-b border-slate-50 ${isToday ? 'bg-cyan-50/20' : ''}`} />
                ))}

                {/* Event blocks */}
                {dayEvents.map((event) => {
                  const start = new Date(event.start_time);
                  const end = new Date(event.end_time);
                  const startMinutes = start.getHours() * 60 + start.getMinutes();
                  const endMinutes = end.getHours() * 60 + end.getMinutes();
                  const topOffset = ((startMinutes - 6 * 60) / 60) * 56; // 56px = h-14
                  const height = Math.max(((endMinutes - startMinutes) / 60) * 56, 24);
                  const color = event.color || EVENT_TYPE_COLORS[event.event_type] || "#6b7280";

                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick?.(event.id)}
                      className="absolute left-0.5 right-0.5 rounded-lg px-1.5 py-1 overflow-hidden cursor-pointer hover:brightness-110 transition-all group text-left"
                      style={{
                        top: `${topOffset}px`,
                        height: `${height}px`,
                        backgroundColor: `${color}15`,
                        borderLeft: `3px solid ${color}`,
                      }}
                    >
                      <p className="text-[10px] font-medium leading-tight truncate" style={{ color }}>
                        {event.title}
                      </p>
                      {height > 32 && (
                        <p className="text-[8px] opacity-60 mt-0.5 truncate" style={{ color }}>
                          {formatTime(event.start_time)} — {formatTime(event.end_time)}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MONTH VIEW
// ═══════════════════════════════════════════════════════════
function MonthView({
  events, currentDate, today, onDayClick, onEventClick,
}: {
  events: PomodyEvent[];
  currentDate: Date;
  today: Date;
  onDayClick: (d: Date) => void;
  onEventClick?: (id: string) => void;
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  return (
    <div className="h-full flex flex-col p-4">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_ES.map((d) => (
          <div key={d} className="text-center text-[9px] text-slate-400 uppercase tracking-widest font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;

          const cellDate = new Date(year, month, day);
          const isToday_ = isSameDay(cellDate, today);
          const dayEvents = events.filter((e) => isSameDay(new Date(e.start_time), cellDate));

          return (
            <button
              key={day}
              onClick={() => onDayClick(cellDate)}
              className={`rounded-xl p-1.5 flex flex-col items-start gap-0.5 min-h-[60px] text-left transition-all hover:bg-slate-50 ${
                isToday_ ? "bg-cyan-50/70 border border-cyan-200" : "border border-transparent"
              }`}
            >
              <span className={`text-[11px] font-medium leading-none ${isToday_ ? "text-cyan-600" : "text-slate-600"}`}>
                {day}
              </span>
              {dayEvents.slice(0, 3).map((ev) => (
                <div
                  key={ev.id}
                  onClick={(e) => { e.stopPropagation(); onEventClick?.(ev.id); }}
                  className="w-full rounded px-1 py-0.5 text-[8px] font-medium truncate leading-tight cursor-pointer hover:brightness-110"
                  style={{
                    backgroundColor: `${ev.color || EVENT_TYPE_COLORS[ev.event_type]}15`,
                    color: ev.color || EVENT_TYPE_COLORS[ev.event_type],
                  }}
                >
                  {ev.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <span className="text-[7px] text-slate-400">+{dayEvents.length - 3} más</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DAY VIEW
// ═══════════════════════════════════════════════════════════
function DayView({
  events, currentDate, today, onEventClick,
}: {
  events: PomodyEvent[];
  currentDate: Date;
  today: Date;
  onEventClick?: (id: string) => void;
}) {
  const dayEvents = events.filter((e) => isSameDay(new Date(e.start_time), currentDate));
  const isToday = isSameDay(currentDate, today);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Time gutter */}
      <div className="w-16 flex-shrink-0 border-r border-slate-100 pt-4">
        {HOURS.map((h) => (
          <div key={h} className="h-16 flex items-start justify-end pr-3 -mt-2">
            <span className="text-[10px] text-slate-300 tabular-nums">{String(h).padStart(2, "0")}:00</span>
          </div>
        ))}
      </div>

      {/* Day column */}
      <div className="flex-1 relative overflow-y-auto pt-4">
        {HOURS.map((h) => (
          <div key={h} className={`h-16 border-b border-slate-50 ${isToday ? 'bg-cyan-50/10' : ''}`} />
        ))}

        {dayEvents.map((event) => {
          const start = new Date(event.start_time);
          const end = new Date(event.end_time);
          const startMinutes = start.getHours() * 60 + start.getMinutes();
          const endMinutes = end.getHours() * 60 + end.getMinutes();
          const topOffset = ((startMinutes - 6 * 60) / 60) * 64 + 16;
          const height = Math.max(((endMinutes - startMinutes) / 60) * 64, 32);
          const color = event.color || EVENT_TYPE_COLORS[event.event_type] || "#6b7280";

          return (
            <button
              key={event.id}
              onClick={() => onEventClick?.(event.id)}
              className="absolute left-2 right-4 rounded-xl px-3 py-2 overflow-hidden cursor-pointer hover:brightness-110 transition-all text-left"
              style={{
                top: `${topOffset}px`,
                height: `${height}px`,
                backgroundColor: `${color}12`,
                borderLeft: `4px solid ${color}`,
              }}
            >
              <p className="text-[12px] font-medium truncate" style={{ color }}>{event.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock size={10} style={{ color }} className="opacity-60" />
                <span className="text-[9px] opacity-60" style={{ color }}>
                  {formatTime(event.start_time)} — {formatTime(event.end_time)}
                </span>
                <span className="text-[8px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider" style={{ backgroundColor: `${color}20`, color }}>
                  {EVENT_TYPE_LABELS[event.event_type]}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
