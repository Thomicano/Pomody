import type { ExtendedEvent } from '../types';
import { differenceInMinutes, parseISO } from 'date-fns';

export interface EventCluster {
  id: string;
  events: ExtendedEvent[];
  topPx: number;
  heightPx: number;
}

export function computeEventClusters(events: ExtendedEvent[], day: Date): EventCluster[] {
  const result: EventCluster[] = [];
  const startOfDay = new Date(day).setHours(0,0,0,0);
  
  const getEffectiveStart = (e: ExtendedEvent) => Math.max(new Date(e.start_time).getTime(), startOfDay);
  const getEffectiveEnd = (e: ExtendedEvent) => new Date(e.end_time).getTime();
  
  const sortedEvents = [...events].sort((a, b) => 
    getEffectiveStart(a) - getEffectiveStart(b)
  );

  let currentCluster: ExtendedEvent[] = [];
  let clusterEnd = 0;

  for (const event of sortedEvents) {
    const start = getEffectiveStart(event);
    const end = getEffectiveEnd(event);

    if (currentCluster.length === 0) {
      currentCluster.push(event);
      clusterEnd = end;
    } else {
      if (start < clusterEnd) {
        currentCluster.push(event);
        clusterEnd = Math.max(clusterEnd, end);
      } else {
        // Terminate cluster
        const effStart = new Date(getEffectiveStart(currentCluster[0]));
        const maxEndDate = new Date(clusterEnd);
        
        result.push({
          id: currentCluster[0].id,
          events: currentCluster,
          topPx: effStart.getHours() * 60 + effStart.getMinutes(),
          heightPx: Math.max(differenceInMinutes(maxEndDate, effStart), 28)
        });
        
        currentCluster = [event];
        clusterEnd = end;
      }
    }
  }

  if (currentCluster.length > 0) {
    const effStart = new Date(getEffectiveStart(currentCluster[0]));
    const maxEndDate = new Date(clusterEnd);
    result.push({
        id: currentCluster[0].id,
        events: currentCluster,
        topPx: effStart.getHours() * 60 + effStart.getMinutes(),
        heightPx: Math.max(differenceInMinutes(maxEndDate, effStart), 28)
    });
  }

  return result;
}
