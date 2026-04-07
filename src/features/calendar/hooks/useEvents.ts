import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import type { EventBase, ExtendedEvent } from '../types';

export interface CustomCategory {
  id: string;
  name: string;
  color_hex: string;
}

export function useEvents() {
  const [events, setEvents] = useState<EventBase[]>([]);
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data, error } = await supabase
        .from('custom_categories')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });
        
      if (error) {
        // If table doesn't exist yet, we catch it silently as we just deployed the migration file for the user to run
        console.warn('Could not fetch categories (table might not exist yet):', error);
        return;
      }
      setCategories(data as CustomCategory[]);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const addCategory = async (name: string, colorHex: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("No session");
      const { data, error } = await supabase.from('custom_categories').insert({
        user_id: session.user.id,
        name,
        color_hex: colorHex
      }).select().single();
      
      if (error) throw error;
      setCategories(prev => [...prev, data]);
      return data;
    } catch (e: any) {
      console.error('Add Category Error:', e);
      return null;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const fetchEvents = useCallback(async (startDate: Date, endDate: Date) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      console.log('📡 [useEvents] RAW Data from Supabase:', data);
      setEvents(data as EventBase[]);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addEvent = useCallback(async (newEvent: Partial<EventBase>) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([newEvent])
        .select()
        .single();

      if (error) throw error;
      setEvents(prev => [...prev, data as EventBase]);
      return { success: true, data };
    } catch (err: any) {
      console.error('Error adding event:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const updateEvent = useCallback(async (id: string, updates: Partial<EventBase>) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setEvents(prev => prev.map(e => (e.id === id ? (data as EventBase) : e)));
      return { success: true, data };
    } catch (err: any) {
      console.error('Error updating event:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setEvents(prev => prev.filter(e => e.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting event:', err);
      return { success: false, error: err.message };
    }
  }, []);

  return { events, categories, isLoading, error, fetchEvents, addEvent, updateEvent, deleteEvent, addCategory, fetchCategories };
}
