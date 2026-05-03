import type { ClanId } from "@/lib/character";
import type { ChroniclePayload, NarradorRequestBody } from "@/lib/narrativeTypes";

import { CLAN_LENS_LINES } from "@/lib/narrativeAssembly/clanLenses";
import { parseCodexSignalsFromSheetSummary } from "@/lib/narrativeAssembly/parseSheetSummary";
import { resolveNarrativeEngineContext } from "@/data/knowledge";

function stableHash(parts: string[]): number {
  const s = parts.filter(Boolean).join("|");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function clip(s: string, n: number): string {
  const t = s.trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}

function pick<T>(items: readonly T[], h: number, salt: number): T {
  return items[(h + salt) % items.length]!;
}

function chronicleBullets(c?: ChroniclePayload): string[] {
  if (!c) return [];
  const out: string[] = [];
  const f = c.foundations?.trim();
  const a = c.AMBIENTE?.trim();
  const t = c.TENSION?.trim();
  const e = c.ESTADO_GLOBAL?.trim();
  const v = c.VINCULO_HILOS?.trim();
  if (f) out.push(`Cimientos / continuidad larga: ${clip(f, 320)}`);
  if (a) out.push(`Ambiente activo: ${clip(a, 220)}`);
  if (t) out.push(`Tensión dirigida (trama / facciones): ${clip(t, 220)}`);
  if (e) out.push(`Estado propagado (rumor / consecuencias): ${clip(e, 220)}`);
  if (v) out.push(`Vínculo entre hilos: ${clip(v, 220)}`);
  return out;
}

export type NarrativeWeave = {
  /** Bloque compacto para modelos LLM: ensambla Génesis + CODEX sin reemplazar la hoja completa. */
  llmDirectiveBlock: string;
  /** 1–2 frases (2.ª persona) para el motor interno y coherencia local. */
  internalSceneFragment: string;
  /** Semillas estables para hash de variantes (opener / ritmos). */
  stableSeedParts: readonly string[];
};

/**
 * Capa de integración: la crónica aporta campo de fuerzas compartido;
 * el CODEX aporta lente perceptivo y ganchos de identidad.
 * No sustituye la hoja larga: la guía a leerla en escena.
 */
export function assembleNarrativeWeaveBrief(
  body: Pick<NarradorRequestBody, "sheetSummary" | "chronicle" | "worldNexusContext" | "narrativeStrand">,
): NarrativeWeave {
  const sig = parseCodexSignalsFromSheetSummary(body.sheetSummary ?? "");
  const engineCtx = resolveNarrativeEngineContext(sig);
  const clan: ClanId = sig.clanGuess ?? "other";
  const h = stableHash([
    body.sheetSummary?.slice?.(0, 400) ?? "",
    sig.linajeLine,
    sig.concepto,
    body.chronicle?.TENSION ?? "",
    body.chronicle?.ESTADO_GLOBAL ?? "",
  ]);

  const lensCandidates = CLAN_LENS_LINES[clan] ?? CLAN_LENS_LINES.other;
  const lensLine = pick(lensCandidates, h, 2);

  const tugSource =
    body.chronicle?.TENSION?.trim() ||
    body.chronicle?.ESTADO_GLOBAL?.trim() ||
    body.chronicle?.AMBIENTE?.trim() ||
    "";
  const chronicleTug = tugSource ? clip(tugSource, 180) : "";

  let stateLine = "";
  if (sig.hunger !== null && sig.humanity !== null) {
    stateLine = `Sellos vampíricos en juego (traducir a síntomas / presión, no a manual): hambre ${sig.hunger}/5 · humanidad ${sig.humanity}.`;
  } else if (sig.hunger !== null) {
    stateLine = `Hambre en juego (${sig.hunger}/5) — priorizar física del apetito y del silencio social.`;
  }

  const conceptClip = clip(sig.concepto, 200);
  const backClip = clip(sig.transfondo, 280);

  const bullets = chronicleBullets(body.chronicle);

  const macroBlock =
    bullets.length > 0
      ? bullets.map((x) => `• ${x}`).join("\n")
      : "• (Génesis aún liviana — anclá escena desde acción, resumen vivo y CODEX sin «día uno» artificial.)";

  const engineMacro =
    engineCtx.directiveLines.length > 0
      ? `\n\nMOTOR · BASE DIEGÉTICA CLAN/DISCIPLINA/POLÍTICA (traducí a consecuencias de escena, no a manual textual):\n${engineCtx.directiveLines.map((x) => `• ${x}`).join("\n")}`
      : "";

  const llmDirectiveBlock = [
    "PROPÓSITO: ENSAMBLAR crónica compartida (Centro de Mando / Génesis) + identidad CODEX de ESTE vampiro.",
    "",
    "Cómo usar esto:",
    "• MACRO (crónica): conflictos, tensión institucional, rumores que existen igual para todos.",
    "• MICRO (CODEX): cómo este linaje transfondo disciplinas habilidades y hambre filtran qué percibe primero el PJ.",
    "• Inventá lugar y NPC, pero no contradigas fuerzas declaradas aquí ni hagas canon grupal nuevo en Nexo sin coordinación mesa.",
    "",
    "FUERZAS CRÓNICAS (telón que comparten todos, con lecturas divergentes):",
    macroBlock,
    "",
    "IDENTIDAD DE ESTE PJ (matiz obligatorio — perspectiva, no omnisciencia):",
    `• Quién: ${sig.nombre || "—"} · Linaje: ${sig.linajeLine || "—"}${sig.antitribuFlag ? " · Marca política probable: antitribu." : ""}.`,
    `• Lente del linaje (guía perceptiva): ${lensLine}`,
    `• Concepto: ${conceptClip || "(sin concepto cargado.)"}`,
    backClip ? `• Transfondo / preludio (firma corta — no pisar otros PJ ni el canon ajeno sin permiso mesa): ${backClip}` : null,
    sig.disciplinesLine ? `• Disciplinas resaltadas: ${clip(sig.disciplinesLine, 240)}` : null,
    sig.skillsLine ? `• Hábitos de habilidad: ${clip(sig.skillsLine, 240)}` : null,
    sig.resonance ? `• Resonancia declarada: ${clip(sig.resonance, 180)}` : null,
    stateLine ? `• Estado mecánico traducible: ${stateLine}` : null,
    body.worldNexusContext?.trim()
      ? `• Continuidad NEXO (dinámico): ${clip(body.worldNexusContext.trim(), 340)}`
      : null,
  ]
    .filter((x): x is string => Boolean(x))
    .join("\n")
    .concat(engineMacro);

  const internalSceneFragment = [
    chronicleTug && `La crónica empuja esta noche: ${chronicleTug}`,
    lensLine,
    engineCtx.perceptualAccent.trim() ? clip(engineCtx.perceptualAccent, 220) : "",
  ]
    .filter(Boolean)
    .join("\n");

  const stableSeedParts = [
    lensLine,
    chronicleTug,
    conceptClip,
    engineCtx.clanKey ?? "",
    engineCtx.disciplineHooks.map((d) => d.key).join(","),
  ] as const;

  return { llmDirectiveBlock, internalSceneFragment, stableSeedParts };
}
