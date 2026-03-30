import React from 'react';

interface AuroraProps {
  colorStops?: [string, string];
  speed?: number;
}

export default function Aurora({ 
  colorStops = ["#38bdf8", "#818cf8"], 
  speed = 1 
}: AuroraProps) {
  // Usamos animaciones CSS hiper fluidas. 
  // Esto simula un shader WebGL con menor coste de GPU y estética glassmorphism impecable.
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#050b14] pointer-events-none">
      {/* Glow 1 */}
      <div 
        className="absolute top-[-30%] left-[-10%] w-[120%] h-[120%] mix-blend-screen opacity-50"
        style={{
          background: `radial-gradient(ellipse at center, ${colorStops[0]} 0%, transparent 60%)`,
          filter: 'blur(120px)',
          animation: `aurora-blob-spin ${30 / speed}s linear infinite`
        }}
      />
      {/* Glow 2 */}
      <div 
        className="absolute bottom-[-20%] right-[-10%] w-[100%] h-[100%] mix-blend-screen opacity-40"
        style={{
          background: `radial-gradient(ellipse at center, ${colorStops[1]} 0%, transparent 60%)`,
          filter: 'blur(100px)',
          animation: `aurora-blob-spin-reverse ${25 / speed}s linear infinite`
        }}
      />
      
      <style>{`
        @keyframes aurora-blob-spin {
          0% { transform: rotate(0deg) scale(1) translateX(5%); }
          50% { transform: rotate(180deg) scale(1.2) translateX(-5%); }
          100% { transform: rotate(360deg) scale(1) translateX(5%); }
        }
        @keyframes aurora-blob-spin-reverse {
          0% { transform: rotate(360deg) scale(1) translateY(5%); }
          50% { transform: rotate(180deg) scale(1.1) translateY(-5%); }
          100% { transform: rotate(0deg) scale(1) translateY(5%); }
        }
      `}</style>
    </div>
  );
}
