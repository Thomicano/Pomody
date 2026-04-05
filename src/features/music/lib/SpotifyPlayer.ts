import { type MusicAdapter, type PlayerState } from "../../types/types";

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

export class SpotifyPlayer implements MusicAdapter {
  private player: any = null;
  private onStateChangeCallback?: (state: PlayerState) => void;

  constructor(token: string) {
    // 🔵 Redefinimos la función que ya creamos en el HTML
    window.onSpotifyWebPlaybackSDKReady = () => {
      this.player = new window.Spotify.Player({
        name: 'Pomody Studio OS',
        getOAuthToken: (cb: any) => { cb(token); },
        volume: 0.5
      });

      // Escuchamos cambios
      this.player.addListener('player_state_changed', (state: any) => {
        if (!state || !this.onStateChangeCallback) return;
        this.onStateChangeCallback({
          isPlaying: !state.paused,
          trackName: state.track_window.current_track.name,
          artist: state.track_window.current_track.artists[0].name,
          albumArt: state.track_window.current_track.album.images[0].url,
          progressMs: state.position,
          durationMs: state.duration,
        });
      });
      // 🟢 Agregá este Listener para debuguear la visibilidad
      this.player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('📱 Dispositivo listo con ID:', device_id);
      });

      this.player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('⚠️ El dispositivo se desconectó:', device_id);
      });
      this.player.connect().then((success: boolean) => {
        if (success) console.log("✅ [Spotify SDK] Dispositivo Pomody OS conectado");
      });

    };

    // 🟢 Si el SDK ya cargó (muy probable), ejecutamos la función manualmente YA
    if (window.Spotify) {
      window.onSpotifyWebPlaybackSDKReady();
      // 🟡 3. Conectamos con un pequeño delay para asegurar estabilidad
      setTimeout(() => {
        this.player.connect().then((success: boolean) => {
          if (success) {
            console.log("✅ [Spotify SDK] Dispositivo 'Pomody Studio OS' registrado con éxito");
          } else {
            console.error("❌ [Spotify SDK] Falló la conexión del dispositivo");
          }
        });
      }, 1000); // 1 segundo de cortesía
    }
  }
  // ... resto de métodos (play, pause, etc)


  // Métodos de la interfaz
  async play() { await this.player?.resume(); }
  async pause() { await this.player?.pause(); }
  async next() { await this.player?.nextTrack(); }
  async previous() { await this.player?.previousTrack(); }

  openExternal() {
    window.open("https://open.spotify.com", "_blank");
  }

  subscribe(callback: (state: PlayerState) => void) {
    this.onStateChangeCallback = callback;
    // Emitimos un estado inicial "idle" para que el widget salga del estado de carga
    callback({
      isPlaying: false,
      trackName: "Spotify Ready",
      artist: "Pomody OS",
      albumArt: "",
      progressMs: 0,
      durationMs: 0,
    });
  }
}