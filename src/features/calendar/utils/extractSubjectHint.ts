/**
 * Extrae la materia / categoría desde frases en español tipo
 * "Parcial de Física el lunes", "Repaso para Química mañana".
 */
export function extractSubjectHintFromSpanish(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const dePara = trimmed.match(
    /\b(?:de|para)\s+([^,]+?)(?=\s+(?:el|la|los|las|un|una|unos|unas|mañana|pasado|hoy|lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo|a\s+las|a\s+la|el\s+\d|los\s+\d|\d{1,2}(?::\d{2})?)|$)/i
  );
  if (dePara) {
    let subj = dePara[1].trim();
    subj = subj.replace(/\s+(?:parcial|examen|final|clase|repaso|tarea|tp|trabajo)\s*$/i, '').trim();
    if (subj.length >= 2) return subj;
  }

  return null;
}
