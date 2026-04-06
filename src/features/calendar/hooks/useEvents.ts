import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import type { EventBase, ExtendedEvent } from '../types';

export function useEvents() {
  const [events, setEvents] = useState<EventBase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return { events, isLoading, error, fetchEvents, addEvent, updateEvent, deleteEvent };
}
