import { supabase } from '@/lib/supabaseClient';
import type { CustomCategory } from '../types';
import { defaultColorForCategoryIndex } from '../constants/categoryPalette';

export async function fetchCustomCategoriesForUser(): Promise<CustomCategory[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];
  const { data, error } = await supabase
    .from('custom_categories')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: true });
  if (error) {
    console.warn('[omnibarCategories]', error);
    return [];
  }
  return (data as CustomCategory[]) ?? [];
}

/**
 * Busca categoría por nombre (case-insensitive) o la crea con color de paleta por defecto.
 */
export async function findOrCreateCategoryBySubject(
  subject: string,
  existing: CustomCategory[]
): Promise<{ id: string } | null> {
  const trimmed = subject.trim();
  if (!trimmed) return null;
  const low = trimmed.toLowerCase();
  const found = existing.find((c) => c.name.toLowerCase() === low);
  if (found) return { id: found.id };

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const color = defaultColorForCategoryIndex(existing.length);
  const { data, error } = await supabase
    .from('custom_categories')
    .insert({
      user_id: session.user.id,
      name: trimmed,
      color_hex: color,
    })
    .select()
    .single();

  if (error) {
    console.warn('[omnibarCategories] create', error);
    return null;
  }
  return { id: (data as CustomCategory).id };
}
