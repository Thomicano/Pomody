import { motion } from 'framer-motion';
import DigitalClock from "@/components/DigitalClock";
import PremiumOmnibar from "@/components/PremiumOmnibar";
import StickyNotes from "@/components/StickyNotes";

export default function HomeScreen({ isDockVisible }: { isDockVisible: boolean }) {
  return (
    <>
      {/* Capa Central: Reloj y Buscador */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 pointer-events-none flex-shrink-0 flex flex-col items-center w-full max-w-2xl px-4 md:px-0 z-50">
        <div className="pointer-events-auto w-full flex justify-center"><DigitalClock /></div>
        <div className="pointer-events-auto w-full"><PremiumOmnibar /></div>
      </div>

      {/* Zona Inferior: StickyNotes con Intelligent Overlap */}
      <motion.div 
        animate={{ y: isDockVisible ? -90 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute bottom-12 left-0 w-full flex justify-center items-center z-20 pointer-events-none px-4"
      >
        <div className="pointer-events-auto">
          <StickyNotes />
        </div>
      </motion.div>
    </>
  );
}
