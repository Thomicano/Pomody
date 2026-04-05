import { useEffect, useState, useRef } from "react";
import { createMusicEngine } from "../lib/MusicEngine";
import type { PlayerState, MusicAdapter } from "../../types/types";

const HARDCODED_TOKEN = "BQDKRkp9M0NwJfkOIYYtaRrpigrjGjQZNn80QRTT9nxSU_6Nz3lvIUVjRGybGVEMZELBS8Af2KsX_Bw_kse9A1rzK70-JShki-_kOENMtZUVoGl7sxu5EhBqk6jC-upqLEiTWpCr3wzdvDoE9bbZMJZ8VPLBpaJiMqAVcPlhCZFqCbIFCh9BGMgTVqGvskcf9TF_Jm2E_SbL316Fk_kbYH751559p_bFb_2TNjeyPjZ0F6fUm9IZ5TWqzTyoe8xmqvC3fPjagemkUw"
// Por ahora pasamos un token de prueba hardcodeado o vacío hasta que conectemos el login real
export function useMusicPlayer(isPremium: boolean, token?: string) {
  const [state, setState] = useState<PlayerState | null>(null);
  // Usamos useRef para mantener la instancia del motor sin causar re-renders infinitos
  const engineRef = useRef<MusicAdapter | null>(null);

  useEffect(() => {
    // Inicializamos el "Cerebro"
    console.log("🛠️ [Hook] Intentando arrancar con Hardcoded Token");
    const engine = createMusicEngine(true, isPremium, HARDCODED_TOKEN);

    // Lo guardamos en la referencia
    engineRef.current = engine;

    // Nos suscribimos para que React se entere cada vez que cambia la canción
    engine.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      // Acá iría la lógica para limpiar/apagar el reproductor si el usuario cierra el widget
    };
  }, [isPremium]);

  return {
    state,
    engine: engineRef.current
  };
}