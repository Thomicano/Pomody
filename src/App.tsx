import { useState } from 'react';
import DigitalClock from "@/components/DigitalClock";
import PomodoroTimer from "@/components/PomodoroTimer";
import StickyNotes from "@/components/StickyNotes";

export default function App() {
  const [flashColor, setFlashColor] = useState<string | null>(null);
  // Función para activar el flash desde cualquier componente
  const triggerFlash = (color: 'study' | 'break') => {
    setFlashColor(color);
    // Desvanecer el flash después de 600ms
    setTimeout(() => setFlashColor(null), 600);
  };
  return (
    // 1. Contenedor principal: Ocupa el 100% del ancho (w-full) y alto de la pantalla (h-screen) sin bordes
    <div className="relative w-full h-screen overflow-hidden font-sans antialiased text-white ">

      {/* 2. Fondo a pantalla completa */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500">
        <div className="absolute inset-0 bg-gradient-radial from-blue-400/30 to-blue-900/10 opacity-60"></div>
      </div>
      {/* Flash de Feedback Global */}
      <div 
        className={`absolute inset-0 z-[9999] pointer-events-none transition-opacity duration-500
          ${flashColor === 'study' ? 'bg-white opacity-20' : ''}
          ${flashColor === 'break' ? 'bg-cyan-300 opacity-20' : ''}
          ${flashColor === null ? 'opacity-0' : ''}
        `}
      />
      {/* 3. Contenido de la aplicación */}
      <div className="relative z-10 w-full h-full">
      
        {/* Reproductor multimedia - Arriba al centro */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[400px] h-[60px] bg-black/70 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center opacity-50">
          <span className="text-white/50 text-xs">Reproductor</span>
        </div>

        {/* --- EL RELOJ DIGITAL --- */}
        {/* Centrado horizontalmente y un poco hacia arriba */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2">
          <DigitalClock />
        </div>

        {/* Temporizador Pomodoro - A la derecha */}
        <div className="absolute top-1/2 right-24 -translate-y-1/2 z-50">
          <PomodoroTimer onCycleComplete={triggerFlash} />
        </div>

        {/* Notas adhesivas - Footer / Centro */}
        <div className="absolute bottom-8 left-0 w-full flex justify-center z-20">
          <StickyNotes />
        </div>

        {/* Iconos de estado - Abajo a la derecha */}
        <div className="absolute bottom-6 right-8 flex gap-4 text-white opacity-80">
          <span className="text-sm">Wi-Fi</span>
          <span className="text-sm">Bat.</span>
        </div>

      </div>
    </div>
  );
}