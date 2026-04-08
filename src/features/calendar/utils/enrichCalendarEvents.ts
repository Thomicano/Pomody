import type { CustomCategory, EventBase, ExtendedEvent, CalendarFilter } from '../types';

const SYSTEM_PALETTE: Record<string, { hex: string; bgHex: string; iconName?: string }> = {
  EXAMEN: { hex: '#ef4444', bgHex: '#fef2f2', iconName: 'AlertCircle' },
  TAREA: { hex: '#3b82f6', bgHex: '#eff6ff', iconName: 'Book' },
  REPASO: { hex: '#10b981', bgHex: '#ecfdf5', iconName: 'Repeat' },
  OTRO: { hex: '#64748b', bgHex: '#f8fafc', iconName: 'Calendar' },
};

function softBg(hex: string): string {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return '#f8fafc';
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},0.12)`;
}

export function enrichCalendarEvents(
  rawEvents: EventBase[],
  filters: CalendarFilter,
  customCategories: CustomCategory[]
): ExtendedEvent[] {
  const catById = new Map(customCategories.map((c) => [c.id, c]));
  const catByName = new Map(customCategories.map((c) => [c.name.toLowerCase(), c]));

  const dt = filters.disabledTypes ?? [];

  const displayEvents = rawEvents.filter((e) => {
    if (dt.includes(e.event_type)) return false;

    const linked = catById.get(e.event_type);
    if (linked) {
      if (dt.includes(linked.id) || dt.includes(linked.name)) return false;
    }

    const byTypeName = catByName.get(String(e.event_type).toLowerCase());
    if (byTypeName && (dt.includes(byTypeName.id) || dt.includes(byTypeName.name))) return false;

    return true;
  });

  return displayEvents.map((e) => {
    let colorHex: string;
    let iconName: string | undefined;

    const linked = catById.get(e.event_type);
    if (linked) {
      colorHex = linked.color_hex;
      iconName = 'Tag';
    } else {
      const byName = catByName.get(String(e.event_type).toLowerCase());
      if (byName) {
        colorHex = byName.color_hex;
        iconName = 'Tag';
      } else {
        const sys = SYSTEM_PALETTE[e.event_type as keyof typeof SYSTEM_PALETTE];
        if (sys) {
          colorHex = sys.hex;
          iconName = sys.iconName;
        } else {
          colorHex = SYSTEM_PALETTE.OTRO.hex;
          iconName = 'Calendar';
        }
      }
    }

    const colorBgHex = softBg(colorHex);

    return {
      ...e,
      colorHex,
      colorBgHex,
      iconName,
    };
  });
}
