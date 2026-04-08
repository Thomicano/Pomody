import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🔴 [Supabase] Falta configuración de variables de entorno (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).");
} else {
  console.log("🟢 [Supabase] Conexión establecida con éxito");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// ═══════════════════════════════════════════════════════════
// TYPES — Sincronizados con supabase/schema.sql
// ═══════════════════════════════════════════════════════════

export type EventType = 'EXAMEN' | 'TAREA' | 'REPASO' | 'OTRO';

export interface PomodyEvent {
  id: string;
  calendar_id: string;
  user_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  event_type: string;
  color: string | null;
  all_day: boolean;
  is_completed: boolean;

  created_at: string;
}

export interface PomodyCalendar {
  id: string;
  user_id: string;
  name: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

export interface PomodyNote {
  id: string;
  user_id: string;
  title: string;
  content: string;
  color: string;
  event_id: string | null;
  created_at: string;
}

export interface PomodyTask {
  id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════
// COLORES POR event_type (ARCHITECTURE.md)
// ═══════════════════════════════════════════════════════════

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  EXAMEN: '#ef4444',
  TAREA: '#3b82f6',
  REPASO: '#22c55e',
  OTRO: '#6b7280',
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  EXAMEN: 'Examen',
  TAREA: 'Tarea',
  REPASO: 'Repaso',
  OTRO: 'Otro',
};

// ═══════════════════════════════════════════════════════════
// DATA HELPERS
// ═══════════════════════════════════════════════════════════

export async function fetchUserCalendars(): Promise<PomodyCalendar[]> {
  const { data, error } = await supabase
    .from('calendars')
    .select('*')
    .order('is_default', { ascending: false });

  if (error) {
    console.warn("⚠️ [Supabase] Error al buscar calendarios:", error);
    return [];
  }
  return data || [];
}

export async function getDefaultCalendar(): Promise<PomodyCalendar | null> {
  const { data } = await supabase
    .from('calendars')
    .select('*')
    .eq('is_default', true)
    .single();
  return data;
}

export async function fetchUserEvents(
  startRange?: string,
  endRange?: string
): Promise<PomodyEvent[]> {
  let query = supabase.from('events').select('*');

  if (startRange) query = query.gte('start_time', startRange);
  if (endRange) query = query.lte('end_time', endRange);

  const { data, error } = await query.order('start_time', { ascending: true });

  if (error) {
    console.warn("⚠️ [Supabase] Error al buscar eventos:", error);
    return [];
  }
  return data || [];
}

export async function fetchEventById(eventId: string): Promise<PomodyEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) {
    console.warn("⚠️ [Supabase] Error al buscar evento:", error);
    return null;
  }
  return data;
}

export async function createEvent(event: Omit<PomodyEvent, 'id' | 'created_at'>): Promise<PomodyEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select()
    .single();

  if (error) {
    console.warn("⚠️ [Supabase] Error al crear evento:", error);
    return null;
  }
  return data;
}

export async function updateEvent(eventId: string, updates: Partial<PomodyEvent>): Promise<boolean> {
  const { error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId);

  if (error) {
    console.warn("⚠️ [Supabase] Error al actualizar evento:", error);
    return false;
  }
  return true;
}

export async function fetchNotesForEvent(eventId: string): Promise<PomodyNote[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn("⚠️ [Supabase] Error al buscar notas del evento:", error);
    return [];
  }
  return data || [];
}

export async function fetchUserTasks(): Promise<PomodyTask[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn("⚠️ [Supabase] Error al buscar tareas:", error);
    return [];
  }
  return data || [];
}

export async function createTask(task: Omit<PomodyTask, 'id' | 'created_at'>): Promise<PomodyTask | null> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();

  if (error) {
    console.warn("⚠️ [Supabase] Error al crear tarea:", error);
    return null;
  }
  return data;
}

export async function updateTask(taskId: string, updates: Partial<PomodyTask>): Promise<boolean> {
  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId);

  if (error) {
    console.warn("⚠️ [Supabase] Error al actualizar tarea:", error);
    return false;
  }
  return true;
}
