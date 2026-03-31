import { createUserClient } from './supabaseClient.ts';
import { User } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

/**
 * Extrae y verifica el usuario que dispara la Edge Function.
 * Lanza un error 401 que la función principal debe atrapar si la sesión expiró 
 * o el token no fue provisto.
 */
export async function getAuthUser(req: Request): Promise<User> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('401: Unauthorized. Token de autenticación faltante.');
  }

  const supabase = createUserClient(req);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('401: Sesión caducada o inválida.');
  }

  return user;
}
