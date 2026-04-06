import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export function useMagicAI() {
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseNaturalInput = useCallback(async (input: string) => {
    setIsThinking(true);
    setError(null);
    try {
      // Direct call to Edge Function which wraps Groq logic internally
      const { data, error: invokeError } = await supabase.functions.invoke('parse-event', {
        body: { input, localTime: new Date().toISOString() },
      });

      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);

      return { success: true, event: data.event };
    } catch (err: any) {
      console.error('Magic AI Error:', err.message);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsThinking(false);
    }
  }, []);

  return { parseNaturalInput, isThinking, error };
}
