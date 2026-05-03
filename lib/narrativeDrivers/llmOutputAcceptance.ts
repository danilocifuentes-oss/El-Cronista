/**
 * Criterios de aceptación de salidas LLM antes de servir al jugador.
 * Si fallan → el pipeline prueba el siguiente driver (hasta motor interno).
 */

const REFUSAL_HEAD = /^(lo\s+siento|sorry|i\s+cannot|no\s+puedo|as\s+an?\s+ai|como\s+modelo\s+de\s+lenguaje)/i;

function letterishCount(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c > 127) n += 1;
  }
  return n;
}

/** Demasiado repetición = basura o degeneración del modelo. */
function repetitionScore(s: string): number {
  if (s.length < 80) return 0;
  const sample = s.slice(0, 400).toLowerCase();
  const words = sample.split(/\s+/).filter((w) => w.length > 3);
  if (words.length < 8) return 0;
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  let max = 0;
  for (const v of freq.values()) max = Math.max(max, v);
  return max / words.length;
}

export type AcceptResult = { ok: true } | { ok: false; reason: string };

/** Narración canal (post-sanitize o equivalente). */
export function acceptNarradorOutput(narration: string, opts?: { rollingSummary?: string; suggestions?: string[] }): AcceptResult {
  const t = narration.trim();
  if (t.length < 24) return { ok: false, reason: "narracion_muy_corta" };
  if (t.length > 14_000) return { ok: false, reason: "narracion_excesiva" };
  if (letterishCount(t) < 12) return { ok: false, reason: "narracion_sin_prosa" };
  const firstLine = t.split(/\r?\n/)[0]?.trim() ?? "";
  if (firstLine.length < 40 && REFUSAL_HEAD.test(firstLine)) return { ok: false, reason: "narracion_rechazo_modelo" };
  if (repetitionScore(t) > 0.34) return { ok: false, reason: "narracion_repetitiva" };

  const rs = opts?.rollingSummary?.trim();
  if (rs && rs.length > 4_000) return { ok: false, reason: "resumen_desproporcionado" };

  const sug = opts?.suggestions;
  if (sug?.length) {
    for (const s of sug) {
      const u = s.trim();
      if (u.length > 220) return { ok: false, reason: "sugerencia_larga" };
      if (u.length > 0 && u.length < 2) return { ok: false, reason: "sugerencia_trivial" };
    }
  }
  return { ok: true };
}

/** Texto Cronista MANIFESTAR (post-sanitize). */
export function acceptCronistaNarration(text: string): AcceptResult {
  const t = text.trim();
  if (t.length < 32) return { ok: false, reason: "cronista_muy_corto" };
  if (t.length > 20_000) return { ok: false, reason: "cronista_excesivo" };
  if (letterishCount(t) < 14) return { ok: false, reason: "cronista_sin_prosa" };
  const head = t.slice(0, 120).toLowerCase();
  if (/^(error|err:|http\s*\d|json\s*parse)/i.test(head)) return { ok: false, reason: "cronista_olor_error" };
  if (REFUSAL_HEAD.test(t.slice(0, 200))) return { ok: false, reason: "cronista_rechazo_modelo" };
  if (repetitionScore(t) > 0.38) return { ok: false, reason: "cronista_repetitivo" };
  return { ok: true };
}
