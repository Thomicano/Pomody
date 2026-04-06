import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import type { CalendarViewType, EventBase, ExtendedEvent, CalendarFilter, EventType } from '../types';

interface CalendarContextProps {
  currentView: CalendarViewType;
  setCurrentView: (view: CalendarViewType) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  selectedEvent: ExtendedEvent | null;
  setSelectedEvent: (event: ExtendedEvent | null) => void;
  filters: CalendarFilter;
  setFilters: (filters: CalendarFilter) => void;
  onEventClick?: (id: string) => void;
  setOnEventClick: (fn: ((id: string) => void) | undefined) => void;
  
  // Computations
  currentRange: { start: Date; end: Date };
  enrichEvents: (events: EventBase[]) => ExtendedEvent[];
}

const CalendarContext = createContext<CalendarContextProps | undefined>(undefined);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<CalendarViewType>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ExtendedEvent | null>(null);
  const [filters, setFilters] = useState<CalendarFilter>({ disabledTypes: [], hideCompleted: false } as any);
  const [onEventClick, setOnEventClick] = useState<((id: string) => void) | undefined>(undefined);

  // Deriva el rango necesario para instanciar el fetch desde useEvents
  const currentRange = useMemo(() => {
    switch (currentView) {
      case 'month':
        return { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) };
      case 'week':
        return { start: startOfWeek(selectedDate, { weekStartsOn: 1 }), end: endOfWeek(selectedDate, { weekStartsOn: 1 }) };
      case 'day':
      default:
        return { start: startOfDay(selectedDate), end: endOfDay(selectedDate) };
    }
  }, [currentView, selectedDate]);

  // Convierte entidades crudas a ExtendedEvents inyectando estilos visuales 
  const enrichEvents = useCallback((rawEvents: EventBase[]): ExtendedEvent[] => {
    const PALETTE: Record<EventType, { hex: string, bgHex: string, iconName?: string }> = {
      EXAMEN: { hex: '#ef4444', bgHex: '#fef2f2', iconName: 'AlertCircle' }, // Tailwind Red
      TAREA: { hex: '#3b82f6', bgHex: '#eff6ff', iconName: 'Book' },         // Tailwind Blue
      REPASO: { hex: '#10b981', bgHex: '#ecfdf5', iconName: 'Repeat' },      // Tailwind Emerald
      OTRO: { hex: '#64748b', bgHex: '#f8fafc', iconName: 'Calendar' },      // Tailwind Slate
    };

    let displayEvents = rawEvents;
    if (filters.disabledTypes && filters.disabledTypes.length > 0) {
       displayEvents = displayEvents.filter(e => !filters.disabledTypes!.includes(e.event_type));
    }

    return displayEvents.map(e => {
        const style = PALETTE[e.event_type] || PALETTE.OTRO;
        const colorHex = e.color || style.hex;
        const colorBgHex = e.color ? e.color + '15' : style.bgHex;

        return {
            ...e,
            colorHex, 
            colorBgHex,
            iconName: style.iconName
        };
    });
  }, []);

  const value = {
    currentView,
    setCurrentView,
    selectedDate,
    setSelectedDate,
    selectedEvent,
    setSelectedEvent,
    filters,
    setFilters,
    currentRange,
    enrichEvents,
    onEventClick,
    setOnEventClick
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendarState() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendarState must be used within a CalendarProvider');
  }
  return context;
}
