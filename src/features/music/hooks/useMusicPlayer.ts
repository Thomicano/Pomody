import { useEffect, useState, useRef } from "react";
import { createMusicEngine } from "../lib/MusicEngine";
import { getValidAccessToken } from "../../auth/tokenManager";
import type { PlayerState, MusicAdapter } from "../../types/types";

export function useMusicPlayer(isPremium: boolean) {
  const [state, setState] = useState<PlayerState | null>(null);
  const engineRef = useRef<MusicAdapter | null>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // Intentamos obtener un token real (auto-refresh incluido)
      const token = await getValidAccessToken();

      if (cancelled) return;

      const useReal = !!token && token.length > 20;
      console.log(useReal
        ? `🎵 [MusicPlayer] Arrancando con token real (${token!.substring(0, 10)}...)`
        : "🎵 [MusicPlayer] Arrancando en modo Mock (sin token válido)"
      );

      const engine = createMusicEngine(useReal, isPremium, token || "");
      engineRef.current = engine;

      engine.subscribe((newState) => {
        if (!cancelled) setState(newState);
      });
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [isPremium]);

  return {
    state,
    engine: engineRef.current,
  };
}