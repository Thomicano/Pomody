export type EventType = string;

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
  color?: string; // fallback original field if needed
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
}
