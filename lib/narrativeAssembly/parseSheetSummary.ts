import { CLAN_OPTIONS, type ClanId } from "@/lib/character";

/** Firmas CODEX esperadas desde `buildSheetSummary` (`lib/sheetSummary.ts`). */
export type ParsedCodexSignals = {
  nombre: string;
  linajeLine: string;
  clanGuess: ClanId | null;
  antitribuFlag: boolean;
  concepto: string;
  transfondo: string;
  generacion: string;
  yearsUnlife: string;
  hunger: number | null;
  humanity: number | null;
  resonance: string;
  disciplinesLine: string;
  skillsLine: string;
  /** Desde etiqueta CODEX Nexo cuando existe (`Potencia de sangre: N`). */
  bloodPotency: number | null;
  /** Marcas de daño físico V5 desde resumen CODEX. */
  healthDamage: number | null;
};

/** Etiquetas de bloque CODEX conocidas desde `buildSheetSummary` — corta campos multi-línea. */
const CODEX_SECTION_PREFIXES = [
  "Nombre:",
  "Linaje:",
  "Concepto:",
  "Generación (mes):",
  "No-vida (años):",
  "Hambre Σ:",
  "Humanidad:",
  "Daño a salud (marcas):",
  "Voluntad:",
  "Potencia de sangre:",
  "Resonancia:",
  "Habilidades destacadas:",
  "Disciplinas:",
] as const;

function lineAfterPrefix(lines: readonly string[], prefix: string): string {
  const idx = lines.findIndex((l) => l.startsWith(prefix));
  if (idx < 0) return "";
  const first = lines[idx]!.slice(prefix.length).trim();
  const more: string[] = [];
  for (let j = idx + 1; j < lines.length; j += 1) {
    const l = lines[j]!;
    if (CODEX_SECTION_PREFIXES.some((p) => l.startsWith(p))) break;
    if (l.trim()) more.push(l.trim());
  }
  return [first, ...more].join(" ").trim();
}

/** Resuelve `ClanId` desde la etiqueta humana («Ventrue», «Thin-blood», …). */
function inferClanId(linajeLine: string): { clanGuess: ClanId | null; antitribu: boolean } {
  const raw = linajeLine.trim();
  if (!raw) return { clanGuess: null, antitribu: false };
  const ant = /\(\s*antitribu\s*\)/i.test(raw);
  const core = raw.replace(/\(\s*antitribu\s*\)/gi, "").trim();
  const low = core.toLowerCase();
  let best: { id: ClanId; label: string } | undefined;
  for (const opt of CLAN_OPTIONS) {
    const lab = opt.label.toLowerCase();
    if (low === lab || low.startsWith(`${lab}`)) {
      if (!best || lab.length > best.label.length) best = opt;
    }
  }
  return { clanGuess: best?.id ?? null, antitribu: ant };
}

/** Parsea el bloque CODEX cuando proviene del generador Nexo estándar. */
export function parseCodexSignalsFromSheetSummary(sheetSummary: string): ParsedCodexSignals {
  const text = sheetSummary.trim();
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd());

  const nombre = lineAfterPrefix(lines, "Nombre:");
  let linajeLine = lineAfterPrefix(lines, "Linaje:");
  if (!linajeLine && /linaje\s*:/i.test(text)) {
    const m = text.match(/linaje\s*:\s*([^\n]+)/i);
    linajeLine = (m?.[1] ?? "").trim();
  }
  const concepto = lineAfterPrefix(lines, "Concepto:");
  const transfondo = lineAfterPrefix(lines, "Transfondo (historia / vínculos / secretos jugables):");

  const { clanGuess, antitribu } = inferClanId(linajeLine);

  const hungerM = text.match(/Hambre\s*Σ\s*:\s*(\d+)\s*\/\s*5/i);
  const humanityM = text.match(/Humanidad\s*:\s*(\d+)/i);
  const potencyM = text.match(/Potencia\s+de\s+sangre\s*:\s*(\d+)/i);
  const healthM = text.match(/Daño\s+a\s+salud\s*\(marcas\)\s*:\s*(\d+)/i);

  return {
    nombre,
    linajeLine,
    clanGuess,
    antitribuFlag: antitribu,
    concepto,
    transfondo,
    generacion: lineAfterPrefix(lines, "Generación (mes):"),
    yearsUnlife: lineAfterPrefix(lines, "No-vida (años):"),
    hunger: hungerM ? Number(hungerM[1]) : null,
    humanity: humanityM ? Number(humanityM[1]) : null,
    resonance: lineAfterPrefix(lines, "Resonancia:"),
    disciplinesLine: lineAfterPrefix(lines, "Disciplinas:"),
    skillsLine: lineAfterPrefix(lines, "Habilidades destacadas:"),
    bloodPotency: potencyM ? Number(potencyM[1]) : null,
    healthDamage: healthM ? Number(healthM[1]) : null,
  };
}
