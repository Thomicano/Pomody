import DigitalClock from './components/DigitalClock';

export default function App() {
  return (
    // 1. Contenedor principal: Ocupa el 100% del ancho (w-full) y alto de la pantalla (h-screen) sin bordes
    <div className="relative w-full h-screen overflow-hidden">
      
      {/* 2. Fondo a pantalla completa */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500">
        <div className="absolute inset-0 bg-gradient-radial from-blue-400/30 to-blue-900/10 opacity-60"></div>
      </div>

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
        <div className="absolute top-1/2 right-12 -translate-y-1/2 w-[350px] h-[400px] bg-white rounded-xl shadow-2xl p-8 opacity-50">
          <span className="text-black/50 text-xs">Pomodoro</span>
        </div>

        {/* Notas adhesivas - Abajo al centro */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-8 opacity-50">
          <div className="w-[180px] h-[180px] bg-orange-100 rounded-sm shadow-xl rotate-[-3deg]"></div>
          <div className="w-[180px] h-[180px] bg-amber-50 rounded-sm shadow-xl rotate-[1deg]"></div>
          <div className="w-[180px] h-[180px] bg-slate-100 rounded-sm shadow-xl rotate-[4deg]"></div>
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