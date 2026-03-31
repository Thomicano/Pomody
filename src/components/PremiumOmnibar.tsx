import { useEffect, useRef, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

export default function PremiumOmnibar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Escuchar el atajo de teclado Cmd+K o Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // (Cmd/Ctrl + K)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      // Salir con Esc
      if (e.key === 'Escape' && isFocused) {
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  const handleSubmit = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    setIsLoading(true);
    setFeedback(null);
    try {
      const { error } = await supabase.functions.invoke('parse-event', {
        body: { input: inputValue }
      });

      if (error) throw error;
      
      setFeedback({ msg: 'Evento agendado con IA', type: 'success' });
      setInputValue('');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      console.error(err);
      setFeedback({ msg: 'Error de IA/Auth', type: 'error' });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-lg mx-auto mt-6 z-40 pointer-events-auto">
      
      {/* Contenedor principal con efecto glassmorphism */}
      <motion.div 
        animate={{ 
          scale: isFocused ? 1.02 : 1,
          borderColor: isFocused ? 'rgba(255,255,255,0.3)' : feedback?.type === 'success' ? 'rgba(16,185,129,0.5)' : feedback?.type === 'error' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative flex items-center w-full px-4 py-3 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 shadow-lg overflow-hidden group"
      >
        
        {/* Efecto Animado Border-Beam que aparece al estar en Focus */}
        <AnimatePresence>
          {isFocused && !feedback && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent z-0"
              style={{
                boxShadow: "0 0 10px 1px rgba(34,211,238,0.5)"
              }}
            />
          )}
        </AnimatePresence>

        {/* Icono de búsqueda dinámico */}
        <div className="relative z-10 text-white/50 mr-3 flex-shrink-0">
          {isLoading ? (
            <Loader2 size={18} className="animate-spin text-cyan-400" />
          ) : (
            <Search size={18} className={`transition-colors duration-300 ${isFocused ? 'text-cyan-400' : 'text-white/40'}`} />
          )}
        </div>

        {/* Campo de Texto (Input) */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={feedback ? feedback.msg : "¿Qué planeamos hoy, Thomas?"}
          disabled={isLoading}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`relative z-10 w-full bg-transparent text-sm md:text-base focus:outline-none focus:ring-0 selection:bg-cyan-500/30 ${feedback?.type === 'success' ? 'text-emerald-400 placeholder-emerald-400' : feedback?.type === 'error' ? 'text-red-400 placeholder-red-400' : 'text-white/90 placeholder-white/30'}`}
        />

        {/* Indicador de Atajo (Kbd) */}
        <motion.div 
          animate={{ opacity: isFocused || inputValue || feedback ? 0 : 1 }}
          className="relative z-10 flex items-center gap-1 opacity-50 ml-3 pointer-events-none"
        >
          <kbd className="font-sans px-2 py-0.5 text-[10px] text-white/60 bg-white/10 rounded-md border border-white/10">
            {navigator.userAgent.includes('Mac') ? '⌘' : 'Ctrl'}
          </kbd>
          <kbd className="font-sans px-2 py-0.5 text-[10px] text-white/60 bg-white/10 rounded-md border border-white/10">
            K
          </kbd>
        </motion.div>

      </motion.div>
    </div>
  );
}
