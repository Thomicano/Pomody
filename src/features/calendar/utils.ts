import { parseISO, getHours, getMinutes } from 'date-fns';

export const isAllDay = (startTime: string, endTime: string): boolean => {
  if (!startTime || !endTime) return false;
  
  const s = parseISO(startTime);
  const e = parseISO(endTime);
  
  // Aceptamos que termine a las 23:55+ como válido para fin del día
  return getHours(s) === 0 && getMinutes(s) === 0 && getHours(e) === 23 && getMinutes(e) >= 55;
};

export const isEventInDay = (startTime: string, endTime: string, day: Date): boolean => {
  if (!startTime || !endTime) return false;
  
  const start = parseISO(startTime).getTime();
  const end = parseISO(endTime).getTime();
  const startOfDay = new Date(day).setHours(0, 0, 0, 0);
  const endOfDay = new Date(day).setHours(23, 59, 59, 999);
  
  return start <= endOfDay && end >= startOfDay;
};
