import type { ParsedCodexSignals } from "@/lib/narrativeAssembly/parseSheetSummary";
import { resolveNarrativeEngineContext } from "@/data/knowledge";

function clipSuggestion(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/**
 * Inyecta un hilo Clan/Disciplina en la última ranura útil manteniendo 3 opciones tácticas.
 * Equivale práctico a «generateOptions» consumiendo la misma base que `assembleNarrativeWeaveBrief`.
 */
export function weaveKnowledgeIntoActionSuggestions(
  parsed: ParsedCodexSignals,
  baseThree: readonly string[],
  stableSalt: number,
): string[] {
  const ctx = resolveNarrativeEngineContext(parsed);
  const out = [...baseThree];
  if (out.length === 0) return out;

  let injected = "";
  if (ctx.disciplineHooks.length) {
    const d = ctx.disciplineHooks[stableSalt % ctx.disciplineHooks.length]!;
    injected = `Dejá filtrar tu don (${d.key}): ${d.useHint}.`;
  }
  if (ctx.clanProfile?.hooks?.length) {
    const hook = ctx.clanProfile.hooks[stableSalt % ctx.clanProfile.hooks.length]!;
    const clanBit = `Sangre ${ctx.clanProfile.name}: ${hook}.`;
    injected = injected ? `${injected} ${clanBit}` : clanBit;
  }

  if (!injected) return out.slice(0, 3).map((s) => clipSuggestion(s, 118));

  const idx = Math.min(2, out.length - 1);
  out[idx] = clipSuggestion(`${out[idx] ?? ""} — ${injected}`.trim().replace(/^—\s*/, ""), 118);
  return out.slice(0, 3).map((s) => clipSuggestion(s, 118));
}
