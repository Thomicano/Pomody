/** Google Calendar–style 4×6 solid palette (24 swatches) */
export const GOOGLE_CALENDAR_CATEGORY_PALETTE: string[] = [
  '#7986cb', '#33b679', '#8e24aa', '#e67c73', '#f6bf26', '#f4511e',
  '#039be5', '#616161', '#3f51b5', '#0b8043', '#d60000', '#f09300',
  '#c2185b', '#c0ca33', '#e91e63', '#009688', '#673ab7', '#ff7043',
  '#4285f4', '#7cb342', '#ad1457', '#00838f', '#3949ab', '#fdd835',
  '#757575',
];

export function defaultColorForCategoryIndex(existingCount: number): string {
  return GOOGLE_CALENDAR_CATEGORY_PALETTE[existingCount % GOOGLE_CALENDAR_CATEGORY_PALETTE.length];
}
