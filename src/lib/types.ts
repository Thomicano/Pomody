export type PlayerState = {
  isPlaying: boolean;
  trackName: string;
  artist: string;
  albumArt: string;
  progressMs: number;
  durationMs: number;
};

export interface MusicAdapter {
  play(): Promise<void>;
  pause(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  openExternal(): void;
  subscribe(cb: (state: PlayerState) => void): void;
}