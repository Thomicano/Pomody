import { MockPlayer } from "./mockPlayer"
import { SpotifyPlayer } from "./SpotifyPlayer"
import type { MusicAdapter } from "./types"

export function createMusicEngine(useReal: boolean, isPremium: boolean, token: string): MusicAdapter {
  console.log("DEBUG: Token recibido en Engine:", token ? "SÍ (empieza con " + token.substring(0,5) + ")" : "NO (vacío)");
  // 🟢 FORZAMOS: Si hay token, usamos Spotify sí o sí
  if (token && token.length > 20) {
    console.log("🚀 [MusicEngine] Arrancando motor Real con Spotify");
    return new SpotifyPlayer(token);
  }
  
  console.log("Mocking... No se detectó token válido.");
  return new MockPlayer();
}