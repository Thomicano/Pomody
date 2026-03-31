import { useState, useRef } from 'react';
import { Settings, X, Image as ImageIcon, Sparkles, PaintBucket, LayoutGrid, Lock, Upload } from 'lucide-react';
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

interface PanelProps {
  onToggle?: (isOpen: boolean) => void;
}

export default function VisualPreferencesPanel({ onToggle }: PanelProps) {
  const { theme, setTheme, handleImageUpload } = useBackground();
  const [isOpen, setIsOpen] = useState(false);
  const isPremium = true; // TODO: Integrar con persistencia de Auth
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenStatus = (open: boolean) => {
    setIsOpen(open);
    if (onToggle) onToggle(open);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => handleOpenStatus(true)}
        className="absolute top-6 right-8 md:top-8 md:right-8 z-[100] p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all shadow-lg hover:scale-105 pointer-events-auto"
      >
        <Settings className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="absolute top-6 right-8 w-80 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-[100] text-white overflow-hidden pointer-events-auto flex flex-col max-h-[85vh]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5 shrink-0">
        <h3 className="text-sm font-medium tracking-wide uppercase text-white/80 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Display & Entorno
        </h3>
        <button onClick={() => handleOpenStatus(false)} className="text-white/40 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar">
        
        {/* === SECCIÓN 1: MODO DE FONDO === */}
        <div className="space-y-3">
          <label className="text-xs uppercase tracking-widest text-white/40">1. Modo de Fondo</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'gradient', icon: LayoutGrid, label: 'Gradiente' },
              { id: 'aurora', icon: Sparkles, label: 'Aurora' },
              { id: 'image', icon: ImageIcon, label: 'Imagen' },
              { id: 'solid', icon: PaintBucket, label: 'Sólido' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setTheme({ ...theme, activeBgMode: mode.id as BgMode })}
                className={`flex items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-wider rounded-lg border transition-all ${
                  theme.activeBgMode === mode.id 
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-100' 
                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                }`}
              >
                <mode.icon className="w-3 h-3" />
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* === SECCIÓN 2: OPCIONES DEL MODO === */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <label className="text-xs uppercase tracking-widest text-white/40">2. Opciones del Fondo</label>
          
          {theme.activeBgMode === 'gradient' && (
            <div className="flex flex-col gap-2">
              {FREE_GRADIENTS.map(grad => (
                <button
                  key={grad.id}
                  onClick={() => setTheme({ ...theme, activeGradient: grad.id })}
                  className={`px-3 py-2 rounded-lg text-left text-xs tracking-wider uppercase transition-all border ${
                    theme.activeGradient === grad.id ? 'bg-white/20 border-white/50 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                  }`}
                >
                  {grad.label}
                </button>
              ))}
            </div>
          )}

          {theme.activeBgMode === 'solid' && (
            <div className="flex gap-2">
              {FREE_SOLIDS.map(color => (
                <button
                  key={color}
                  onClick={() => setTheme({ ...theme, solidColor: color })}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${theme.solidColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}

          {theme.activeBgMode === 'image' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {FREE_IMAGES.map(img => (
                  <button
                    key={img.id}
                    onClick={() => setTheme({ ...theme, imageParameters: { ...theme.imageParameters, url: img.url } })}
                    className={`flex-1 py-1 px-1 text-center rounded-lg text-[9px] uppercase tracking-widest transition-all border ${
                      theme.imageParameters.url === img.url ? 'bg-white/20 border-white/50 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    {img.label}
                  </button>
                ))}
              </div>
              
              {/* 🟢 FEATURE LOCAL UPLOAD */}
              <div className="pt-2 border-t border-white/5">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors text-xs uppercase tracking-widest"
                >
                  <Upload className="w-4 h-4" />
                  Subir desde dispositivo
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
                <label className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/40">
                  <span>O URL Externa</span>
                  {!isPremium && <span className="text-[9px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-medium tracking-normal">PREMIUM</span>}
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    disabled={!isPremium}
                    value={theme.imageParameters.url.startsWith('blob:') ? '' : theme.imageParameters.url}
                    onChange={(e) => setTheme(prev => ({ ...prev, imageParameters: { ...prev.imageParameters, url: e.target.value } }))}
                    className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-xs text-white/90 outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50"
                    placeholder="https://images.unsplash..."
                  />
                  {!isPremium && <Lock className="w-3 h-3 text-white/40 absolute right-3 top-2.5" />}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 flex justify-between">
                  <span>Desenfoque (Blur)</span>
                  <span className="text-cyan-400">{theme.imageParameters.blur}px</span>
                </label>
                <input 
                  type="range" min="0" max="20" 
                  value={theme.imageParameters.blur}
                  onChange={(e) => setTheme(prev => ({...prev, imageParameters: {...prev.imageParameters, blur: parseInt(e.target.value)}}))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
          )}

          {theme.activeBgMode === 'aurora' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">Color 1</label>
                  <div className="relative w-full h-8 rounded border border-white/20 overflow-hidden transition-transform hover:scale-105">
                    <input 
                      type="color" 
                      value={theme.auroraParameters.color1}
                      onChange={(e) => setTheme(prev => ({ ...prev, auroraParameters: { ...prev.auroraParameters, color1: e.target.value } }))}
                      className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">Color 2</label>
                  <div className="relative w-full h-8 rounded border border-white/20 overflow-hidden transition-transform hover:scale-105">
                    <input 
                      type="color" 
                      value={theme.auroraParameters.color2}
                      onChange={(e) => setTheme(prev => ({ ...prev, auroraParameters: { ...prev.auroraParameters, color2: e.target.value } }))}
                      className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 flex justify-between">
                  <span>Velocidad</span>
                  <span className="text-cyan-400">{theme.auroraParameters.speed.toFixed(1)}x</span>
                </label>
                <input 
                  type="range" min="0.1" max="3" step="0.1"
                  value={theme.auroraParameters.speed}
                  onChange={(e) => setTheme(prev => ({...prev, auroraParameters: {...prev.auroraParameters, speed: parseFloat(e.target.value)}}))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                <span className="text-[10px] text-white/70 uppercase tracking-widest">Aurora activa en descanso</span>
                <button 
                  onClick={() => setTheme({ ...theme, autoAuroraOnBreak: !theme.autoAuroraOnBreak })}
                  className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${theme.autoAuroraOnBreak ? 'bg-cyan-500' : 'bg-white/20'}`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform duration-300 ${theme.autoAuroraOnBreak ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* === SECCIÓN 3: TINTE AMBIENTAL === */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <label className="flex items-center justify-between text-xs uppercase tracking-widest text-white/40">
            <span>3. Tinte Ambiental</span>
            {!isPremium && <span className="text-[9px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-medium tracking-normal">PREMIUM</span>}
          </label>
          <div className="flex items-center gap-3">
            {/* Sin Tinte (Free) */}
            <button
               onClick={() => setTheme({ ...theme, activeTint: null })}
               className={`relative flex items-center justify-center w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 bg-black/50 ${theme.activeTint === null ? 'border-white scale-110' : 'border-white/20'}`}
               title="Sin Tinte (Gratis)"
            >
              <div className="absolute w-[120%] h-[1.5px] bg-red-500/80 rotate-45" />
            </button>
            
            {/* Cian (Free) */}
            <button
                 onClick={() => setTheme({ ...theme, activeTint: '#38bdf8' })}
                 className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${theme.activeTint === '#38bdf8' ? 'border-white scale-110' : 'border-transparent'}`}
                 style={{ backgroundColor: '#38bdf8' }}
                 title="Cian (Gratis)"
            />

            <div className="w-[1px] h-6 bg-white/20 mx-1" />

            {/* Premium Colors */}
            {['#10b981', '#f43f5e', '#8b5cf6', '#f59e0b'].map((color) => (
               <button
                 key={color}
                 onClick={() => isPremium && setTheme({ ...theme, activeTint: color })}
                 className={`relative flex items-center justify-center w-6 h-6 rounded-full border-2 transition-transform ${theme.activeTint === color ? 'border-white scale-110' : 'border-transparent'} ${isPremium ? 'hover:scale-110' : 'opacity-50 cursor-not-allowed'}`}
                 style={{ backgroundColor: color }}
               >
                 {!isPremium && <Lock className="w-3 h-3 text-white/90 absolute drop-shadow-md" />}
               </button>
            ))}

            <div className={`relative w-6 h-6 rounded-full border border-white/20 overflow-hidden transition-transform ${isPremium ? 'cursor-pointer hover:scale-110' : 'opacity-50 cursor-not-allowed'}`}>
               {!isPremium && <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center pointer-events-none"><Lock className="w-3 h-3 text-white/90 drop-shadow-md" /></div>}
               <input 
                 type="color" 
                 disabled={!isPremium}
                 value={theme.activeTint || '#000000'}
                 onChange={(e) => isPremium && setTheme({ ...theme, activeTint: e.target.value })}
                 className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer"
               />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
