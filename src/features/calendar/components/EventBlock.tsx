import React from 'react';
import { motion } from 'framer-motion';
import { differenceInMinutes, parseISO } from 'date-fns';
import type { ExtendedEvent } from '../types';
import { useCalendarState } from '../context/CalendarContext';
import * as LucideIcons from 'lucide-react';

interface EventBlockProps {
  event: ExtendedEvent;
}

export const EventBlock: React.FC<EventBlockProps> = React.memo(({ event }) => {
  const { onEventClick } = useCalendarState();
  // Safe parsing dates
  const startDate = parseISO(event.start_time);
  const endDate = parseISO(event.end_time);

  // Asumimos que el contenedor padre (columna del día) es relative y mapea 1px = 1 minuto (altura total 1440px).
  const topPx = startDate.getHours() * 60 + startDate.getMinutes();
  const heightPx = differenceInMinutes(endDate, startDate);
  
  // Resolución dinámica de ícono calculada en capa de de estado
  const Icon = (LucideIcons[event.iconName as keyof typeof LucideIcons] as React.ElementType) || LucideIcons.Calendar;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={(e) => {
        e.stopPropagation();
        if (onEventClick) {
          onEventClick(event.id);
        } else {
          console.log('Abrir Study Hub para:', event.id);
        }
      }}
      className={`absolute inset-x-px flex flex-col overflow-hidden rounded-md border-[1.5px] cursor-pointer backdrop-blur-sm transition-shadow duration-200 hover:shadow-md ${event.is_completed ? 'opacity-50 line-through' : 'opacity-100'}`}
      style={{
        top: `${topPx}px`,
        height: `${Math.max(heightPx, 24)}px`, // Mínimo garantizado visualmente
        backgroundColor: event.colorBgHex,
        borderColor: event.colorHex,
        color: event.colorHex,
      }}
    >
      <div className="flex items-center gap-1.5 px-2 py-1 relative">
         <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-md opacity-50" style={{ backgroundColor: event.colorHex }} />
         <Icon size={12} strokeWidth={2.5} />
         <span className="text-[10px] sm:text-xs font-semibold leading-tight truncate tracking-wide">
           {event.title}
         </span>
      </div>
    </motion.div>
  );
});

EventBlock.displayName = 'EventBlock';
