import { createAdminClient } from './supabaseClient.ts';

/**
 * Valida de forma segura usando el Service Role si un usuario posee suscripción activa.
 * Ejemplo asumiendo que tu tabla de referenci de Perfiles se llame 'profiles'.
 */
export async function verifyPremiumPlan(userId: string): Promise<boolean> {
  const adminDb = createAdminClient();
  const { data, error } = await adminDb
    .from('profiles')
    .select('is_premium')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('Error verificando plan premium:', error);
    return false;
  }
  
  return data.is_premium === true;
}

/**
 * Valida la existencia de campos requeridos dentro de un body parseado.
 */
export function validatePayload(payload: Record<string, unknown>, requiredFields: string[]): void {
  for (const field of requiredFields) {
    if (!payload[field]) {
      throw new Error(`400: Bad Request. Falta el campo requerido '${field}'.`);
    }
  }
}
