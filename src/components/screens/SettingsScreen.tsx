import { useRef } from 'react';
import { Sparkles, PaintBucket, LayoutGrid, Lock, Image as ImageIcon, Volume2, Play, Upload } from 'lucide-react';
import { useBackground } from '@/hooks/useBackground';
import type { BgMode } from '@/hooks/useBackground';
export const FREE_IMAGES = [
  { id: 'mountains', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000', label: 'Montañas' },
  { id: 'forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2000', label: 'Bosque' },
  { id: 'city', url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2000', label: 'Ciudad' },
  { id: 'renekton', url: 'https://images.contentstack.io/v3/assets/blt7085050800c85078/bltc82df37b4258380e/5db05fd76e82c56ad8cce442/Renekton_0.jpg', label: 'Renekton' }
];

export const FREE_SOLIDS = ['#0f172a', '#171717', '#1e1b4b', '#064e3b', '#4c0519'];

export const FREE_GRADIENTS = [
  { id: 'blue', label: 'Océano', class: 'from-slate-950 via-blue-900/20 to-slate-950' },
  { id: 'purple', label: 'Nebulosa', class: 'from-slate-950 via-purple-900/20 to-slate-950' },
  { id: 'sunset', label: 'Ocaso', class: 'from-slate-950 via-orange-900/20 to-slate-950' }
];

export const SOUND_OPTIONS = [
  { id: 'alert.mp3', label: 'Classic Alert' },
  { id: 'bubble.mp3', label: 'Bubble Drop' },
  { id: 'chime.mp3', label: 'Zen Chime' },
  { id: 'correct-answer.mp3', label: 'Correct Answer' },
  { id: 'correct.mp3', label: 'Success Bell' },
  { id: 'monkey.mp3', label: 'Monkey Play' },
  { id: 'pop.mp3', label: 'Subtle Pop' },
  { id: 'transition-explosion.mp3', label: 'Deep Transition' },
  { id: 'universfield.mp3', label: 'Universfield Aura' },
  { id: 'zipper.mp3', label: 'Zip Swipe' }
];

export default function SettingsScreen() {
  const { theme, setTheme, handleImageUpload } = useBackground();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPremium = true;

  const playPreview = (soundId: string) => {
    const audio = new Audio(`/sounds/${soundId}`);
    audio.volume = 0.5;
    audio.play().catch(e => console.warn(e));
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto mt-4 px-4">
      <div className="w-[85vw] max-w-7xl h-[85vh] bg-white/80 backdrop-blur-xl border border-white/60 rounded-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.1)] flex overflow-hidden">

        {/* Left Sidebar Menu */}
        <div className="w-1/3 md:w-1/4 border-r border-slate-200 p-8 flex flex-col gap-8 bg-white/40 hidden md:flex">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-light tracking-[0.2em] text-slate-800 uppercase">Ajustes</h2>
            <p className="text-slate-500 text-xs tracking-widest uppercase font-light">Personaliza tu entorno Studio OS</p>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-50 text-cyan-800 border border-cyan-100 transition-colors shadow-sm">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <span className="text-xs uppercase tracking-widest font-medium">Entorno y Audio</span>
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-600 transition-colors opacity-50 cursor-not-allowed">
              <Lock className="w-4 h-4" />
              <span className="text-xs uppercase tracking-widest">Cuenta (Pronto)</span>
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="w-full md:w-3/4 p-8 md:p-12 overflow-y-auto custom-scrollbar flex flex-col gap-14">

          {/* === SECCIÓN AUDIO === */}
          <div className="space-y-6">
            <h3 className="text-sm font-medium tracking-wide uppercase text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-4">
              <Volume2 className="w-4 h-4 text-cyan-500" />
              Alarma Pomodoro
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2">
              {SOUND_OPTIONS.map(sound => (
                <div
                  key={sound.id}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${theme.pomodoroSound === sound.id
                      ? 'bg-cyan-50 border-cyan-300 text-cyan-800 shadow-sm'
                      : 'bg-white/60 border-slate-200 text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm'
                    }`}
                >
                  <button
                    onClick={() => setTheme({ ...theme, pomodoroSound: sound.id })}
                    className="flex-1 text-left flex items-center gap-2 text-[11px] uppercase tracking-widest outline-none py-1"
                  >
                    <span>{sound.label}</span>
                    {theme.pomodoroSound === sound.id && <Sparkles className="w-3 h-3 text-cyan-500" />}
                  </button>
                  <button
                    onClick={() => playPreview(sound.id)}
                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all hover:scale-105 outline-none"
                    title="Previsualizar"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* === SECCIÓN FONDOS === */}
          <div className="space-y-6">
            <h3 className="text-sm font-medium tracking-wide uppercase text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-4">
              <LayoutGrid className="w-4 h-4 text-cyan-500" />
              Fondo Animado
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {[
                { id: 'gradient', icon: LayoutGrid, label: 'Gradiente' },
                { id: 'aurora', icon: Sparkles, label: 'Aurora' },
                { id: 'image', icon: ImageIcon, label: 'Imagen' },
                { id: 'solid', icon: PaintBucket, label: 'Sólido' }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setTheme({ ...theme, activeBgMode: mode.id as BgMode })}
                  className={`flex flex-col items-center justify-center gap-3 py-6 text-[10px] uppercase tracking-wider rounded-2xl border transition-all ${theme.activeBgMode === mode.id
                      ? 'bg-cyan-50 border-cyan-300 text-cyan-800 shadow-sm'
                      : 'bg-white/60 border-slate-200 text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm'
                    }`}
                >
                  <mode.icon className="w-6 h-6 mb-1" />
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Opciones Específicas del Modo (Condicionales) */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              {theme.activeBgMode === 'gradient' && (
                <div className="grid grid-cols-3 gap-3">
                  {FREE_GRADIENTS.map(grad => (
                    <button
                      key={grad.id}
                      onClick={() => setTheme({ ...theme, activeGradient: grad.id })}
                      className={`px-4 py-3 rounded-xl text-center text-xs tracking-wider uppercase transition-all border ${theme.activeGradient === grad.id ? 'bg-white border-slate-300 text-slate-800 shadow-sm' : 'bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-white'
                        }`}
                    >
                      {grad.label}
                    </button>
                  ))}
                </div>
              )}

              {theme.activeBgMode === 'solid' && (
                <div className="flex gap-4">
                  {FREE_SOLIDS.map(color => (
                    <button
                      key={color}
                      onClick={() => setTheme({ ...theme, solidColor: color })}
                      className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 shadow-sm ${theme.solidColor === color ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}

              {theme.activeBgMode === 'image' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-3">
                    {FREE_IMAGES.map(img => (
                      <button
                        key={img.id}
                        onClick={() => setTheme({ ...theme, imageParameters: { ...theme.imageParameters, url: img.url } })}
                        className={`py-2 px-2 text-center rounded-xl text-[10px] uppercase tracking-widest transition-all border ${theme.imageParameters.url === img.url ? 'bg-white border-slate-300 text-slate-800 shadow-sm' : 'bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-white'
                          }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>

                  {/* 🟢 FEATURE LOCAL UPLOAD CONSISTENCY */}
                  <div className="pt-2 border-t border-slate-100">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 transition-colors text-xs uppercase tracking-widest font-medium shadow-sm"
                    >
                      <Upload className="w-4 h-4" />
                      Subir imagen desde dispositivo
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/png, image/jpeg, image/webp" 
                      onChange={handleImageUpload}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500">
                      <span>O URL Externa</span>
                      {!isPremium && <span className="text-[9px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded font-medium tracking-normal">PREMIUM</span>}
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        disabled={!isPremium}
                        value={theme.imageParameters.url.startsWith('blob:') ? '' : theme.imageParameters.url}
                        onChange={(e) => setTheme(prev => ({ ...prev, imageParameters: { ...prev.imageParameters, url: e.target.value } }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all disabled:opacity-50 shadow-sm"
                        placeholder="https://images.unsplash..."
                      />
                      {!isPremium && <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-3" />}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 flex justify-between">
                      <span>Desenfoque (Blur)</span>
                      <span className="text-cyan-600">{theme.imageParameters.blur}px</span>
                    </label>
                    <input
                      type="range" min="0" max="20"
                      value={theme.imageParameters.blur}
                      onChange={(e) => setTheme(prev => ({ ...prev, imageParameters: { ...prev.imageParameters, blur: parseInt(e.target.value) } }))}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                </div>
              )}

              {theme.activeBgMode === 'aurora' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-slate-500">Color Primario</label>
                      <input
                        type="color"
                        value={theme.auroraParameters.color1}
                        onChange={(e) => setTheme(prev => ({ ...prev, auroraParameters: { ...prev.auroraParameters, color1: e.target.value } }))}
                        className="w-full h-10 rounded cursor-pointer bg-transparent border border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-slate-500">Color Secundario</label>
                      <input
                        type="color"
                        value={theme.auroraParameters.color2}
                        onChange={(e) => setTheme(prev => ({ ...prev, auroraParameters: { ...prev.auroraParameters, color2: e.target.value } }))}
                        className="w-full h-10 rounded cursor-pointer bg-transparent border border-slate-200"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 border border-slate-200">
                    <span className="text-[11px] text-slate-700 uppercase tracking-widest">Aurora activa en descanso</span>
                    <button
                      onClick={() => setTheme({ ...theme, autoAuroraOnBreak: !theme.autoAuroraOnBreak })}
                      className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${theme.autoAuroraOnBreak ? 'bg-cyan-500' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform duration-300 shadow-sm ${theme.autoAuroraOnBreak ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* === SECCIÓN TINTE AMBIENTAL === */}
          <div className="space-y-4 pb-12">
            <h3 className="text-sm font-medium tracking-wide uppercase text-slate-700 flex items-center justify-between border-b border-slate-200 pb-4">
              <span className="flex items-center gap-2"><PaintBucket className="w-4 h-4 text-cyan-500" /> Tinte Ambiental</span>
              {!isPremium && <span className="text-[9px] text-amber-600 bg-amber-100 border border-amber-200 px-2 py-1 rounded font-medium tracking-normal">PREMIUM</span>}
            </h3>
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => setTheme({ ...theme, activeTint: null })}
                className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 bg-slate-100 ${theme.activeTint === null ? 'border-slate-800 scale-110 shadow-md' : 'border-slate-300'}`}
                title="Sin Tinte (Gratis)"
              >
                <div className="absolute w-[120%] h-[1.5px] bg-red-400 rotate-45" />
              </button>

              <button
                onClick={() => setTheme({ ...theme, activeTint: '#38bdf8' })}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 shadow-sm ${theme.activeTint === '#38bdf8' ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent'}`}
                style={{ backgroundColor: '#38bdf8' }}
                title="Cian (Gratis)"
              />

              <div className="w-[1px] h-8 bg-slate-200 mx-2" />

              {['#10b981', '#f43f5e', '#8b5cf6', '#f59e0b'].map((color) => (
                <button
                  key={color}
                  onClick={() => isPremium && setTheme({ ...theme, activeTint: color })}
                  className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-transform shadow-sm ${theme.activeTint === color ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent'} ${isPremium ? 'hover:scale-110' : 'opacity-50 cursor-not-allowed'}`}
                  style={{ backgroundColor: color }}
                >
                  {!isPremium && <Lock className="w-4 h-4 text-white/90 absolute drop-shadow-md" />}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
