import { useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { GOOGLE_CALENDAR_CATEGORY_PALETTE } from '../constants/categoryPalette';

interface CategoryGooglePopoverProps {
  open: boolean;
  onClose: () => void;
  colorHex: string;
  /** Solo categorías personalizadas en Supabase pueden cambiar color persistido */
  showColorGrid?: boolean;
  onDisplayOnly: () => void;
  onHideFromList: () => void;
  onSettings: () => void;
  onPickColor: (hex: string) => void;
}

export function CategoryGooglePopover({
  open,
  onClose,
  colorHex,
  showColorGrid = true,
  onDisplayOnly,
  onHideFromList,
  onSettings,
  onPickColor,
}: CategoryGooglePopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute left-full top-0 ml-2 z-[999] w-[260px] rounded-xl border border-slate-200/90 bg-white py-2 shadow-[0_12px_40px_rgba(0,0,0,0.18)] animate-in fade-in zoom-in-95 duration-200"
      role="menu"
    >
      <div className="flex flex-col px-1">
        <button
          type="button"
          className="text-left text-[13px] font-medium text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 transition-colors"
          onClick={() => {
            onDisplayOnly();
            onClose();
          }}
        >
          Mostrar solo esto
        </button>
        <button
          type="button"
          className="text-left text-[13px] font-medium text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 transition-colors"
          onClick={() => {
            onHideFromList();
            onClose();
          }}
        >
          Ocultar de la lista
        </button>
        <button
          type="button"
          className="text-left text-[13px] font-medium text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 transition-colors"
          onClick={() => {
            onSettings();
            onClose();
          }}
        >
          Configuración
        </button>
      </div>

      {showColorGrid && (
        <>
          <div className="mx-2 my-2 border-t border-slate-100" />

          <div className="px-3 pb-2">
            <div className="grid grid-cols-6 gap-2">
              {GOOGLE_CALENDAR_CATEGORY_PALETTE.map((hex) => {
                const norm = (h: string) => h.replace('#', '').toLowerCase();
                const isSel = norm(hex) === norm(colorHex);
                return (
                  <button
                    key={hex}
                    type="button"
                    className="relative h-7 w-7 rounded-full border border-black/5 shadow-sm transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    style={{ backgroundColor: hex }}
                    onClick={() => onPickColor(hex)}
                    aria-label={`Color ${hex}`}
                  >
                    {isSel && (
                      <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow" strokeWidth={3} />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[10px] text-slate-400 font-medium">El color se aplica a todos los eventos de esta categoría.</p>
          </div>
        </>
      )}
    </div>


  );
}
