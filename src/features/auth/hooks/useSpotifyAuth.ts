import { useState, useEffect, useCallback, useRef } from "react";
import { generateCodeVerifier, generateCodeChallenge } from "../pkce";
import {
  exchangeCodeForTokens,
  loadTokens,
  clearTokens,
  isTokenExpired,
  refreshAccessToken,
  getValidAccessToken,
} from "../tokenManager";

const CLIENT_ID = "49d13b1a43f5464aaab361a326c3aae6";
const REDIRECT_URI = "http://127.0.0.1:5174/callback";
const SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "streaming",
  "user-read-email",
  "user-read-private",
  "playlist-read-private",       
  "playlist-read-collaborative"   
].join(" ");

export interface SpotifyAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  error: string | null;
}

export function useSpotifyAuth() {
  const [state, setState] = useState<SpotifyAuthState>({
    isAuthenticated: false,
    isLoading: true,
    accessToken: null,
    error: null,
  });

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 🛡️ BLOQUEO ANTI-DUPLICADOS (Soluciona el error 400)
  const authProcessed = useRef(false);

  const scheduleRefresh = useCallback((expiresAt: number) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    const msUntilRefresh = expiresAt - Date.now() - 120_000;
    if (msUntilRefresh <= 0) return;

    console.log(`⏰ [Auth] Auto-refresh programado en ${Math.round(msUntilRefresh / 1000)}s`);

    refreshTimerRef.current = setTimeout(async () => {
      const tokens = loadTokens();
      if (!tokens) return;
      try {
        const refreshed = await refreshAccessToken(tokens.refreshToken);
        setState((prev) => ({ ...prev, accessToken: refreshed.accessToken }));
        scheduleRefresh(refreshed.expiresAt);
      } catch {
        setState({
          isAuthenticated: false,
          isLoading: false,
          accessToken: null,
          error: "Sesión expirada. Por favor, volvé a iniciar sesión.",
        });
      }
    }, msUntilRefresh);
  }, []);

  useEffect(() => {
    const init = async () => {
      // Si ya procesamos la auth en este ciclo, no hacemos nada
      if (authProcessed.current) return;

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const errorParam = urlParams.get("error");

      if (errorParam) {
        authProcessed.current = true;
        window.history.replaceState({}, document.title, "/");
        setState({ isAuthenticated: false, isLoading: false, accessToken: null, error: "Acceso denegado." });
        return;
      }

      if (code) {
        authProcessed.current = true; // 🔒 Bloqueamos futuras ejecuciones
        console.log("🎫 [Auth] Code detectado. Intercambiando...");
        
        try {
          // Limpiamos la URL AL TOQUE
          window.history.replaceState({}, document.title, "/");
          
          const tokens = await exchangeCodeForTokens(code);
          setState({
            isAuthenticated: true,
            isLoading: false,
            accessToken: tokens.accessToken,
            error: null,
          });
          scheduleRefresh(tokens.expiresAt);
          return;
        } catch (err) {
          console.error("❌ [Auth] Error en el exchange:", err);
          setState({
            isAuthenticated: false,
            isLoading: false,
            accessToken: null,
            error: "Error al intercambiar el código.",
          });
          return;
        }
      }

      // No hay code, chequeamos tokens locales
      const existingTokens = loadTokens();
      if (existingTokens && !authProcessed.current) {
        authProcessed.current = true;
        if (!isTokenExpired(existingTokens)) {
          setState({
            isAuthenticated: true,
            isLoading: false,
            accessToken: existingTokens.accessToken,
            error: null,
          });
          scheduleRefresh(existingTokens.expiresAt);
          return;
        }

        try {
          const refreshed = await refreshAccessToken(existingTokens.refreshToken);
          setState({
            isAuthenticated: true,
            isLoading: false,
            accessToken: refreshed.accessToken,
            error: null,
          });
          scheduleRefresh(refreshed.expiresAt);
          return;
        } catch {
          console.warn("⚠️ [Auth] Refresh falló.");
        }
      }

      setState(prev => ({ ...prev, isLoading: false }));
    };

    init();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [scheduleRefresh]);

  const login = useCallback(async () => {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);
    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: "code",
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      code_challenge_method: "S256",
      code_challenge: challenge,
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    authProcessed.current = false;
    setState({ isAuthenticated: false, isLoading: false, accessToken: null, error: null });
  }, []);

  return { ...state, login, logout, getToken: getValidAccessToken };
}