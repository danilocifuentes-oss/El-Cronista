import type { DisciplineKey } from "@/lib/sereno";

/**
 * Una marca textual por disciplina en la campaña solitaria.
 * Fuente única para no cruzarse con los glifos SVG de mesa (Inquisición, Sangre…).
 * Si se evoluciona a SVG propios, usar sólo referencia visual ajena (wiki, libros) sin copiar sellos oficiales.
 */
export const SOLO_DISCIPLINE_GLYPH: Record<DisciplineKey, string> = {
  animalism: "⁂",
  auspex: "◇",
  blood_sorcery: "⧫",
  celerity: "⟩",
  dominate: "⬡",
  fortitude: "◼",
  obfuscate: "□",
  potence: "⬟",
  presence: "✦",
  protean: "△",
};

export function soloDisciplineGlyph(key: DisciplineKey): string {
  return SOLO_DISCIPLINE_GLYPH[key];
}
