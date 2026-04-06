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
      className={`absolute inset-x-0 flex flex-col overflow-hidden rounded-[8px] border shadow-sm cursor-pointer backdrop-blur-md transition-all duration-200 hover:-translate-y-px hover:shadow-md ${event.is_completed ? 'opacity-50 line-through' : 'opacity-100'}`}
      style={{
        top: `${topPx}px`,
        height: `${Math.max(heightPx, 20)}px`,
        backgroundColor: event.colorBgHex,
        borderColor: event.colorHex,
      }}
    >
      <div className="flex items-center gap-1.5 px-2 py-1 relative w-full border-l-2" style={{ borderLeftColor: event.colorHex }}>
         <Icon size={11} strokeWidth={2.5} style={{ color: event.colorHex }} className="shrink-0" />
         <span className="text-[11px] font-bold leading-none truncate tracking-wide text-slate-800">
           {event.title}
         </span>
      </div>
    </motion.div>
  );
});

EventBlock.displayName = 'EventBlock';
