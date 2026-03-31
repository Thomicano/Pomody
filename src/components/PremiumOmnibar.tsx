import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PremiumOmnibar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

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

  return (
    <div className="relative w-full max-w-lg mx-auto mt-6 z-40 pointer-events-auto">
      
      {/* Contenedor principal con efecto glassmorphism */}
      <motion.div 
        animate={{ 
          scale: isFocused ? 1.02 : 1,
          borderColor: isFocused ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative flex items-center w-full px-4 py-3 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 shadow-lg overflow-hidden group"
      >
        
        {/* Efecto Animado Border-Beam que aparece al estar en Focus */}
        <AnimatePresence>
          {isFocused && (
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
          <Search size={18} className={`transition-colors duration-300 ${isFocused ? 'text-cyan-400' : 'text-white/40'}`} />
        </div>

        {/* Campo de Texto (Input) */}
        <input
          ref={inputRef}
          type="text"
          placeholder="¿Qué planeamos hoy, Thomas?"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="relative z-10 w-full bg-transparent text-white/90 text-sm md:text-base placeholder-white/30 focus:outline-none focus:ring-0 selection:bg-cyan-500/30"
        />

        {/* Indicador de Atajo (Kbd) */}
        <motion.div 
          animate={{ opacity: isFocused ? 0 : 1 }}
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
