import { parseISO, getHours, getMinutes } from 'date-fns';

export const isAllDay = (startTime: string, endTime: string): boolean => {
  if (!startTime || !endTime) return false;
  
  const s = parseISO(startTime);
  const e = parseISO(endTime);
  
  // Aceptamos que termine a las 23:55+ como válido para fin del día
  return getHours(s) === 0 && getMinutes(s) === 0 && getHours(e) === 23 && getMinutes(e) >= 55;
};
