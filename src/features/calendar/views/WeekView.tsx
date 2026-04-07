import React, { useMemo } from 'react';
import { startOfWeek } from 'date-fns';
import { useCalendarState } from '../context/CalendarContext';
import type { EventBase, ExtendedEvent } from '../types';
import { CalendarGrid } from '../components/CalendarGrid';
import { DayColumn } from '../components/DayColumn';

export default function WeekView({ events, onTimeSlotClick, onDeleteEvent, onOpenPopover }: { events: EventBase[], onTimeSlotClick?: (start: string, end: string) => void, onDeleteEvent?: (id: string) => void, onOpenPopover?: (date: Date, rect: DOMRect, dayEvents: ExtendedEvent[]) => void }) {
  const { selectedDate, enrichEvents } = useCalendarState();

  const startDay = useMemo(() => {
     return startOfWeek(selectedDate, { weekStartsOn: 1 });
  }, [selectedDate]);

  const enrichedEvents = useMemo(() => {
    return enrichEvents(events);
  }, [events, enrichEvents]);

  return (
     <CalendarGrid 
        startDate={startDay} 
        daysCount={7} 
        enrichedEvents={enrichedEvents}
     >
        {(day, dayEvents, dayIndex) => (
           <DayColumn 
              key={dayIndex}
              day={day}
              dayEvents={dayEvents}
              isToday={new Date().setHours(0,0,0,0) === day.setHours(0,0,0,0)}
              onTimeSlotClick={onTimeSlotClick}
              onDeleteEvent={onDeleteEvent}
              onOpenPopover={onOpenPopover}
           />
        )}
     </CalendarGrid>
  );
}
