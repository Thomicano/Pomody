import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Lofi Girl Live Stream ID: jfKfPfyJRdk
  const videoId = 'jfKfPfyJRdk';

  const sendCommand = (func: string, args: any[] = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      sendCommand('pauseVideo');
    } else {
      sendCommand('playVideo');
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    sendCommand('setVolume', [newVolume]);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
      sendCommand('unMute');
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      sendCommand('unMute');
      sendCommand('setVolume', [volume]);
    } else {
      sendCommand('mute');
    }
    setIsMuted(!isMuted);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      sendCommand('setVolume', [volume]);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed bottom-32 left-4 md:bottom-12 md:left-12 z-[100] flex items-center gap-3 p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl transition-all duration-300 hover:bg-black/50 group w-[240px] md:w-[280px]">
      
      {/* Hidden YouTube Iframe */}
      <iframe
        ref={iframeRef}
        className="hidden"
        src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&controls=0&disablekb=1&fs=0&modestbranding=1&playsinline=1`}
        allow="autoplay; encrypted-media"
        title="Lofi Music"
      />

      {/* Play/Pause Button */}
      <button 
        onClick={togglePlay}
        className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
      >
        {isPlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-1" />}
      </button>

      {/* Marquee Título */}
      <div className="flex-1 overflow-hidden relative h-6 flex items-center mask-image-linear">
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused] items-center gap-4 text-xs text-white/90 font-medium tracking-wide cursor-default pr-4">
          <div className="flex items-center gap-2">
            <Music size={12} className="text-white/50" />
            <span>Lofi Girl - lofi hip hop radio - beats to relax/study to</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/20">•</span>
            <Music size={12} className="text-white/50" />
            <span>Lofi Girl - lofi hip hop radio - beats to relax/study to</span>
          </div>
        </div>
      </div>

      {/* Volume Control (shows on hover of the player) */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-20 overflow-hidden absolute -top-12 left-0 md:relative md:top-0 md:left-auto bg-black/60 md:bg-transparent p-2 md:p-0 rounded-xl backdrop-blur-md md:backdrop-blur-none border border-white/10 md:border-none">
        <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors flex-shrink-0 cursor-pointer">
          {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={isMuted ? 0 : volume} 
          onChange={handleVolumeChange}
          className="w-16 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
        />
      </div>
    </div>
  );
}
