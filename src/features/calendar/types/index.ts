export type EventType = string;

/** Categoría personalizada en Supabase (`custom_categories`) */
export interface CustomCategory {
  id: string;
  name: string;
  color_hex: string;
}

export interface EventBase {
  id: string;
  user_id: string;
  calendar_id?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  event_type: EventType;
  is_completed: boolean;
  all_day?: boolean;

  created_at?: string;

}

export interface ExtendedEvent extends EventBase {
  // Frontend computed fields for UI injection
  colorHex: string;
  colorBgHex: string;
  iconName?: string;
}

export type CalendarViewType = 'month' | 'week' | 'day';

export interface CalendarFilter {
  disabledTypes?: EventType[];
  hideCompleted?: boolean;
  /** Ocultar filas en la sidebar (como "Hide from list" en Google Calendar) */
  sidebarHiddenIds?: EventType[];
}
