import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export interface GoogleAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
}

export function useGoogleAuth() {
  const [state, setState] = useState<GoogleAuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  });

  useEffect(() => {
    // 1. Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        isAuthenticated: !!session,
        isLoading: false,
        user: session?.user ?? null,
        error: null,
      });
    });

    // 2. Listen for auth state changes (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        isAuthenticated: !!session,
        isLoading: false,
        user: session?.user ?? null,
        error: null,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setState((prev) => ({ ...prev, error: error.message }));
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ isAuthenticated: false, isLoading: false, user: null, error: null });
  }, []);

  return { ...state, login, logout };
}
