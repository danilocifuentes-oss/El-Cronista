/**
 * Tokens diegéticos `[[GLYPH:<kind>]]` — solo `kind` en lista blanca (motor interno / texto confiable).
 * El cliente parte el string y renderiza componentes React; nunca se interpreta como HTML.
 */

import type { NexoGlyphKind } from "@/lib/icons/glyphSignals";

const KIND_ALT = "(inquisition|blood|destiny|terminal|vastago|circuit)";

/** Patrón global reutilizable (crear con `new RegExp(..., "g")` por iteración si hace falta estado limpio). */
export const NEXO_GLYPH_TOKEN_PATTERN = `\\[\\[GLYPH:${KIND_ALT}\\]\\]`;

export type NexoGlyphInlineSegment =
  | { type: "text"; value: string }
  | { type: "glyph"; kind: NexoGlyphKind };

function glyphTokenGlobalRe(): RegExp {
  return new RegExp(NEXO_GLYPH_TOKEN_PATTERN, "g");
}

/** Trocea texto + glifos en orden. Sin coincidencias devuelve un solo segmento de texto. */
export function splitNexoGlyphInline(text: string): NexoGlyphInlineSegment[] {
  const re = glyphTokenGlobalRe();
  const out: NexoGlyphInlineSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ type: "text", value: text.slice(last, m.index) });
    out.push({ type: "glyph", kind: m[1] as NexoGlyphKind });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", value: text.slice(last) });
  if (out.length === 0) out.push({ type: "text", value: text });
  return out;
}

/** Kinds presentes en tokens, en orden de primera aparición, sin duplicados. */
export function extractNexoGlyphTokenKindsFromTokens(text: string): NexoGlyphKind[] {
  const re = glyphTokenGlobalRe();
  const ordered: NexoGlyphKind[] = [];
  const seen = new Set<NexoGlyphKind>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const kind = m[1] as NexoGlyphKind;
    if (seen.has(kind)) continue;
    seen.add(kind);
    ordered.push(kind);
  }
  return ordered;
}

/** Quita literales de token conocidos para heurísticas por palabra clave (evita ruido en el riel). */
export function stripNexoGlyphTokenLiterals(text: string): string {
  return text.replace(glyphTokenGlobalRe(), " ");
}
