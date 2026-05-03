import { classifyNexoIntent } from "@/lib/internal-engine/classifyIntent";
import { parseCodexSignalsFromSheetSummary } from "@/lib/narrativeAssembly/parseSheetSummary";
import { normalizeStrand, type NarrativeStrand } from "@/lib/narrativeStrands";
import type { NarradorRequestBody } from "@/lib/narrativeTypes";

/** Recorte seguro para compartir con otra IA o panel admin (sin PII largo). */
const CLIP = {
  field: 2000,
  nexus: 1200,
  rolling: 800,
  action: 600,
} as const;

export type NexoGenesisExtract = {
  foundations: string;
  AMBIENTE: string;
  TENSION: string;
  ESTADO_GLOBAL: string;
  VINCULO_HILOS: string;
  /** Metadatos no textuales útiles para prompts secundarios. */
  nonEmptyFieldCount: number;
};

export type NexoMotorGenesisBundle = {
  /** Génesis / crónica persistente enviada al motor (si existe en el body). */
  genesis: NexoGenesisExtract | null;
  /** Señales parseadas del bloque CODEX en texto (linaje, hambre, humanidad, daño…). */
  codexSignals: ReturnType<typeof parseCodexSignalsFromSheetSummary>;
  intent: ReturnType<typeof classifyNexoIntent>;
  sigma: number;
  narrativeStrand: NarrativeStrand;
  worldNexusContextClip: string;
  rollingSummaryClip: string;
  playerActionClip: string;
  mjDirectiveCount: number;
};

function clip(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/**
 * Extrae textos y datos estructurados que el **motor del Nexo** ya recibe o deriva:
 * Génesis (`chronicle`), CODEX vía `sheetSummary`, σ, hilo, resúmenes y acción.
 * Pensado para IA de apoyo, telemetría o UI de operador — no sustituye al pipeline LLM.
 */
export function extractNexoMotorAndGenesisSignals(body: NarradorRequestBody): NexoMotorGenesisBundle {
  const codexSignals = parseCodexSignalsFromSheetSummary(body.sheetSummary ?? "");
  const intent = classifyNexoIntent(body.playerAction);
  const strand = normalizeStrand(body.narrativeStrand);

  let genesis: NexoGenesisExtract | null = null;
  if (body.chronicle && typeof body.chronicle === "object") {
    const c = body.chronicle;
    const foundations = clip(typeof c.foundations === "string" ? c.foundations : "", CLIP.field);
    const AMBIENTE = clip(typeof c.AMBIENTE === "string" ? c.AMBIENTE : "", CLIP.field);
    const TENSION = clip(typeof c.TENSION === "string" ? c.TENSION : "", CLIP.field);
    const ESTADO_GLOBAL = clip(typeof c.ESTADO_GLOBAL === "string" ? c.ESTADO_GLOBAL : "", CLIP.field);
    const VINCULO_HILOS = clip(typeof c.VINCULO_HILOS === "string" ? c.VINCULO_HILOS : "", CLIP.field);
    const fields = [foundations, AMBIENTE, TENSION, ESTADO_GLOBAL, VINCULO_HILOS];
    const nonEmptyFieldCount = fields.filter((x) => x.trim().length > 0).length;
    genesis = { foundations, AMBIENTE, TENSION, ESTADO_GLOBAL, VINCULO_HILOS, nonEmptyFieldCount };
  }

  return {
    genesis,
    codexSignals,
    intent,
    sigma: Math.max(0, Math.min(5, Math.round(body.inquisitionThreat))),
    narrativeStrand: strand,
    worldNexusContextClip: clip(body.worldNexusContext ?? "", CLIP.nexus),
    rollingSummaryClip: clip(body.rollingSummary ?? "", CLIP.rolling),
    playerActionClip: clip(body.playerAction, CLIP.action),
    mjDirectiveCount: Array.isArray(body.mjDirectives) ? body.mjDirectives.length : 0,
  };
}

/** Versión serializable mínima para JSON (p. ej. logs de admin). */
export function extractNexoMotorAndGenesisSignalsJson(body: NarradorRequestBody): string {
  return JSON.stringify(extractNexoMotorAndGenesisSignals(body), null, 0);
}
