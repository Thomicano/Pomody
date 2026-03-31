import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

/**
 * Cliente seguro de contexto de usuario (RLS)
 * Usa las variables de entorno inyectadas por Supabase y el Header nativo de Authorization
 * del Request para actuar en la base de datos EN NOMBRE DEL USUARIO, respetando RLS.
 */
export function createUserClient(req: Request) {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')!,
        },
      },
      auth: { persistSession: false },
    }
  );
}

/**
 * Cliente de Servicio (Service Role) - ¡PRECAUCIÓN!
 * Este cliente SALTA todas las políticas RLS. Úsalo solo cuando la Edge Function
 * necesite validar planes, crear usuarios o leer información que un usuario normal
 * no podría leer por sí solo. 
 */
export function createAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
