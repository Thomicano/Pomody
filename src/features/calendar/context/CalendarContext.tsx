import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import type { CalendarViewType, EventBase, ExtendedEvent, CalendarFilter, CustomCategory } from '../types';
import { enrichCalendarEvents } from '../utils/enrichCalendarEvents';

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

  customCategories: CustomCategory[];
  setCustomCategories: (cats: CustomCategory[]) => void;

  currentRange: { start: Date; end: Date };
  enrichEvents: (events: EventBase[]) => ExtendedEvent[];
}

export const CalendarContext = createContext<CalendarContextProps | undefined>(undefined);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<CalendarViewType>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ExtendedEvent | null>(null);
  const [filters, setFilters] = useState<CalendarFilter>({
    disabledTypes: [],
    hideCompleted: false,
    sidebarHiddenIds: [],
  });
  const [onEventClick, setOnEventClick] = useState<((id: string) => void) | undefined>(undefined);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);

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

  const enrichEvents = useCallback(
    (rawEvents: EventBase[]): ExtendedEvent[] => {
      return enrichCalendarEvents(rawEvents, filters, customCategories);
    },
    [filters, customCategories]
  );

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
    setOnEventClick,
    customCategories,
    setCustomCategories,
  };

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendarState() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendarState must be used within a CalendarProvider');
  }
  return context;
}
