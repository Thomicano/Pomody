import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';

export default function MusicWidget() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
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

  // Fake progress for visual effect (since getting real progress from iframe without full API is tricky)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) return 0;
          return prev + 0.1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="fixed bottom-32 left-4 md:bottom-12 md:left-12 z-[100] group w-[280px] md:w-[320px] transition-all duration-500">
      <div className="relative rounded-2xl bg-black/40 backdrop-blur-xl border border-white/5 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden p-4 flex flex-col gap-4">
        
        {/* Magic UI Border Beam Effect */}
        <div className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]" style={{ WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', padding: '1.5px' }}>
          <div className="absolute w-[300%] h-[300%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_60%,rgba(255,255,255,0.8)_100%)]" />
        </div>

        {/* Hidden YouTube Iframe */}
        <iframe
          ref={iframeRef}
          className="hidden"
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&controls=0&disablekb=1&fs=0&modestbranding=1&playsinline=1`}
          allow="autoplay; encrypted-media"
          title="Lofi Music"
        />

        {/* Top Section: Art & Info */}
        <div className="flex items-center gap-3">
          {/* Album Art */}
          <div className="w-14 h-14 rounded-lg bg-white/5 border border-white/10 shrink-0 overflow-hidden relative shadow-inner">
            <img 
              src="https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg" 
              alt="Lofi Girl Album Art"
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300 group-hover:scale-105"
            />
          </div>

          {/* Track Info (Marquee) */}
          <div className="flex-1 overflow-hidden flex flex-col justify-center">
            {/* Title Marquee */}
            <div className="overflow-hidden relative h-5 mask-image-linear w-full flex items-center">
              <div className="flex w-max animate-marquee hover:[animation-play-state:paused] items-center gap-4 text-sm text-white font-medium tracking-wide cursor-default pr-4">
                <span>lofi hip hop radio - beats to relax/study to</span>
                <span className="text-white/20">•</span>
                <span>lofi hip hop radio - beats to relax/study to</span>
              </div>
            </div>
            {/* Artist */}
            <div className="text-xs text-white/50 truncate font-light mt-0.5">Lofi Girl</div>
          </div>
        </div>

        {/* Bottom Section: Progress & Controls */}
        <div className="flex flex-col gap-3">
          {/* Shadcn UI Styled Progress Slider */}
          <div className="group/slider relative flex w-full touch-none select-none items-center">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progress}
              onChange={(e) => setProgress(parseFloat(e.target.value))}
              className="w-full h-1.5 appearance-none bg-white/10 rounded-full cursor-pointer 
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-125
                         active:[&::-webkit-slider-thumb]:scale-110"
              style={{
                background: `linear-gradient(to right, white ${progress}%, rgba(255,255,255,0.1) ${progress}%)`
              }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between px-2">
            <Volume2 size={16} className="text-white/30 hover:text-white/80 transition-colors cursor-pointer" />
            
            <div className="flex items-center gap-5">
              <button className="text-white/50 hover:text-white transition-colors">
                <SkipBack size={18} className="fill-current" />
              </button>
              
              <button 
                onClick={togglePlay}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              >
                {isPlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-0.5" />}
              </button>
              
              <button className="text-white/50 hover:text-white transition-colors">
                <SkipForward size={18} className="fill-current" />
              </button>
            </div>

            <div className="w-4" /> {/* Spacer to balance volume icon */}
          </div>
        </div>

      </div>
    </div>
  );
}
