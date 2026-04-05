import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🔴 [Supabase] Falta configuración de variables de entorno (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).");
} else {
  console.log("🟢 [Supabase] Conexión establecida con éxito");
}

export interface PomodyEvent {
  id: string;
  user_id: string;
  calendar_id?: string;
  title: string;
  start_time: string;
  end_time?: string | null;
  event_type?: string;
  color?: string;
  all_day?: boolean;
  created_at?: string;
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Función inicial para interactuar con la DB
export async function fetchUserEvents(): Promise<PomodyEvent[] | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*');
    
  if (error) {
    console.warn("⚠️ [Supabase] Error al buscar eventos:", error);
    return null;
  }
  return data;
}
