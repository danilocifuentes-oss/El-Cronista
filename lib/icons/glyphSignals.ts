/**
 * Señales diegéticas → glifo SchreckNet (solo UI; el motor no inyecta markup).
 * Heurística por palabras clave en español / términos de mesa.
 */

export type NexoGlyphKind = "inquisition" | "blood" | "destiny" | "terminal" | "vastago" | "circuit";

const RULES: readonly { kind: NexoGlyphKind; test: RegExp }[] = [
  {
    kind: "inquisition",
    test: /\b(cámaras?|camaras?|inquisición|inquisicion|inquisitor|segunda\s+inquisición|custodias?|custodio|dron(es)?|reconocimiento\s+facial|biométric|σ\s*\d|sigma)\b/i,
  },
  { kind: "blood", test: /\b(sangre|vitae|hambre|bestia|abraso|sed\s+de\s+sangre|frenes[ií])\b/i },
  { kind: "destiny", test: /\b(dados?|tirad|pool|dificultad|éxito|exito|fracaso|manifest|az(ar|ar))\b/i },
  { kind: "terminal", test: /\b(schreck|nexo|canal|protocolo|consola|buffer|log(s)?|ping)\b/i },
  { kind: "circuit", test: /\b(red|cable|fibra|antena|señal|latencia|servidor|ruta\s+ip|encript)\b/i },
  { kind: "vastago", test: /\b(vástago|vastago|camarilla|pr[ií]ncipe|bar[oó]n|clan|linaje)\b/i },
];

/** Máximo de glifos en riel (legibilidad). */
const MAX_HINTS = 4;

/**
 * Devuelve glifos sugeridos para una línea de log (orden de reglas, sin duplicados).
 */
export function detectNexoGlyphHints(text: string): NexoGlyphKind[] {
  const t = text.trim();
  if (!t) return [];
  const out: NexoGlyphKind[] = [];
  const seen = new Set<NexoGlyphKind>();
  for (const { kind, test } of RULES) {
    if (test.test(t) && !seen.has(kind)) {
      seen.add(kind);
      out.push(kind);
      if (out.length >= MAX_HINTS) break;
    }
  }
  return out;
}

export function glyphKindLabel(kind: NexoGlyphKind): string {
  switch (kind) {
    case "inquisition":
      return "Señal inquisitorial";
    case "blood":
      return "Eco de sangre";
    case "destiny":
      return "Azar / pool";
    case "terminal":
      return "Canal técnico";
    case "circuit":
      return "Trama de red";
    case "vastago":
      return "Política de linaje";
    default:
      return "Glifo";
  }
}
