import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Home, Calendar, Sparkles, Music, StickyNote, Settings, User } from 'lucide-react';

const DOCK_ITEMS = [
  { id: '1', title: 'Home', icon: Home, screenId: 'home' },
  { id: '2', title: 'Schedule', icon: Calendar, screenId: 'calendar' },
  { id: '3', title: 'Magic AI', icon: Sparkles, screenId: 'home' },
  { id: '4', title: 'Media', icon: Music, screenId: 'home' },
  { id: '5', title: 'Notes', icon: StickyNote, screenId: 'home' },
  { id: '6', title: 'Settings', icon: Settings, screenId: 'settings' },
  { id: '7', title: 'Profile', icon: User, screenId: 'home' },
];

function DockIcon({
  mouseX,
  title,
  icon: Icon,
  screenId,
  onScreenChange
}: {
  mouseX: any;
  title: string;
  icon: any;
  screenId?: string;
  onScreenChange?: (screen: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);



  // Calcula la distancia desde el cursor al centro absoluto del icono
  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // Mapeamos la distancia a escala

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 64, 40]);
  
  // Constantes elásticas para la animación
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });
  
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative group flex items-center justify-center">
      {/* Tooltip */}
      {hovered && (
        <motion.div
          initial={{ opacity: 0, y: 10, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 2, x: '-50%' }}
          className="absolute left-1/2 -top-12 z-50 pointer-events-none whitespace-pre rounded-md bg-black/60 backdrop-blur-md px-3 py-1.5 text-xs text-white shadow-xl border border-white/10"
        >
          {title}
        </motion.div>
      )}

      <motion.div
        ref={ref}
        style={{ width }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="aspect-square rounded-2xl bg-white/5 border border-white/10 shadow-lg backdrop-blur-md flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
      >
        <button 
          onClick={() => screenId && onScreenChange?.(screenId)} 
          className="w-full h-full flex items-center justify-center text-white/80 hover:text-white transition-colors duration-200 outline-none"
        >
          <Icon className="w-1/2 h-1/2" />
        </button>
      </motion.div>
    </div>
  );
}

export default function FloatingDock({ 
  isVisible = true, 
  onScreenChange 
}: { 
  isVisible?: boolean;
  onScreenChange?: (screen: string) => void;
}) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] ${isVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="flex h-[58px] items-end gap-3 rounded-3xl bg-black/30 border border-white/10 px-4 pb-2.5 pt-2.5 backdrop-blur-2xl shadow-2xl"
      >
        {DOCK_ITEMS.map((item) => (
          <DockIcon key={item.id} mouseX={mouseX} {...item} onScreenChange={onScreenChange} />
        ))}
      </motion.div>
    </motion.div>
  );
}
