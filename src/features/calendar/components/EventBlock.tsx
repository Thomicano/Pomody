import React from 'react';
import { motion } from 'framer-motion';
import { differenceInMinutes, parseISO } from 'date-fns';
import type { ExtendedEvent } from '../types';
import { useCalendarState } from '../context/CalendarContext';
import * as LucideIcons from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface EventBlockProps {
  event: ExtendedEvent;
  compact?: boolean;
  onDelete?: (id: string) => void;
  solidPill?: boolean;
}

export const EventBlock: React.FC<EventBlockProps> = React.memo(({ event, compact, onDelete, solidPill }) => {
  const { onEventClick } = useCalendarState();
  
  // Resolución dinámica de ícono calculada en capa de estado
  const Icon = (LucideIcons[event.iconName as keyof typeof LucideIcons] as React.ElementType) || LucideIcons.Calendar;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: { type: 'EventBlock', event }
  });

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ 
         scale: 1.02,
         boxShadow: `0px 0px 12px 2px ${event.colorHex}60`, 
         zIndex: 40 
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={(e) => {
        e.stopPropagation();
        if (onEventClick) {
          onEventClick(event.id);
        }
      }}
      /* 
        Solid Pill Constraints: Fondo opaco, colorHex, texto blanco. Layout horizontal estricto compacto.
      */
      className={`relative w-full h-full min-h-[28px] overflow-hidden rounded-md shadow-sm transition-colors group flex items-center justify-between px-2 py-1 gap-2 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : event.is_completed ? 'opacity-50 line-through' : 'opacity-100'}`}
      style={{
        ...(solidPill ? { backgroundColor: event.colorHex } : {
           backgroundColor: event.colorBgHex,
           borderColor: event.colorHex,
           borderWidth: '1px'
        }),
        transform: CSS.Translate.toString(transform),
      }}
    >
      <div className="flex items-center gap-1.5 flex-1 min-w-0" style={{ color: solidPill ? '#fff' : event.colorHex }}>
         <Icon size={12} strokeWidth={3} className="shrink-0" />
         <span className="text-[10px] sm:text-[11px] font-bold leading-tight truncate tracking-wide w-full" style={{ color: solidPill ? '#fff' : event.colorHex }}>
           {event.title}
         </span>
      </div>

      {/* Delete Button - Compact Right Align */}
      <button 
         onClick={(e) => {
            e.stopPropagation();
            onDelete?.(event.id);
         }}
         className={`shrink-0 z-50 p-1 rounded transition-opacity disabled:opacity-0 opacity-0 group-hover:opacity-100 ${solidPill ? 'text-white/80 hover:text-white hover:bg-white/20' : 'bg-white/90 text-red-500 hover:bg-red-50 hover:text-red-600 shadow-sm'}`}
         title="Eliminar evento"
      >
         <LucideIcons.Trash2 size={12} strokeWidth={2.5} />
      </button>
    </motion.div>
  );
});

EventBlock.displayName = 'EventBlock';
