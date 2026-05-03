import type { CharacterSheet } from "@/lib/character";
import { isNarrativeStrand, type NarrativeStrand } from "@/lib/narrativeStrands";
import type { ChroniclePayload } from "@/lib/narrativeTypes";
import type { SerializedV5Roll } from "@/lib/dice";

const MAX_INPUT = 3500;
const MAX_LOG = 5;
const MAX_CHRON = 12000;
const MAX_SYNAPTIC = 4000;
const MAX_IDEAS = 6000;
const MAX_CROSS = 4000;
const MAX_NEXUS = 4500;
const MAX_CODEX_JSON = 14000;

function clampStr(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  return s.length <= max ? s : `${s.slice(0, max)}\n[…]`;
}

export function compactCodex(codex: unknown): string {
  try {
    const s = JSON.stringify(codex);
    return s.length <= MAX_CODEX_JSON ? s : `${s.slice(0, MAX_CODEX_JSON)}\n[…truncado]`;
  } catch {
    return "{}";
  }
}

export type NormalizedCronistaBody = {
  codex: CharacterSheet;
  tirada: SerializedV5Roll;
  hambre: number;
  input: string;
  recentLogs: { role: string; text: string }[];
  stream: boolean;
  chronicle?: ChroniclePayload;
  synapticDisruption?: string;
  ideasRepository?: string;
  narrativeStrand: NarrativeStrand;
  crossStrandContext?: string;
  worldNexusContext?: string;
};

export function normalizeCronistaBody(raw: unknown): NormalizedCronistaBody | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const stream = Boolean(o.stream);

  const codex = o.codex && typeof o.codex === "object" ? (o.codex as CharacterSheet) : null;
  const tirada = o.tirada && typeof o.tirada === "object" ? (o.tirada as SerializedV5Roll) : null;
  if (!codex || !tirada) return null;

  const h = Number(o.hambre);
  const hambre = Number.isFinite(h) ? Math.max(0, Math.min(5, Math.round(h))) : 0;
  const input = clampStr(o.input, MAX_INPUT);

  let recentLogs: { role: string; text: string }[] = [];
  if (Array.isArray(o.recentLogs)) {
    recentLogs = o.recentLogs
      .slice(-MAX_LOG)
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const r = row as Record<string, unknown>;
        const role = typeof r.role === "string" ? r.role.slice(0, 24) : "?";
        const text = clampStr(r.text, 1600);
        return text.trim() ? { role, text } : null;
      })
      .filter((x): x is { role: string; text: string } => Boolean(x));
  }

  let chronicle: ChroniclePayload | undefined;
  if (o.chronicle && typeof o.chronicle === "object") {
    const c = o.chronicle as Record<string, unknown>;
    chronicle = {
      foundations: clampStr(c.foundations, MAX_CHRON),
      AMBIENTE: clampStr(c.AMBIENTE, 2000),
      TENSION: clampStr(c.TENSION, 2000),
      ESTADO_GLOBAL: clampStr(c.ESTADO_GLOBAL, 2000),
      VINCULO_HILOS: c.VINCULO_HILOS ? clampStr(c.VINCULO_HILOS, 2000) : undefined,
    };
  }
  const synRaw = o.synapticDisruption ? clampStr(o.synapticDisruption, MAX_SYNAPTIC) : "";
  const synapticDisruption = synRaw.trim() || undefined;
  const ideasRaw = o.ideasRepository ? clampStr(o.ideasRepository, MAX_IDEAS) : "";
  const ideasRepository = ideasRaw.trim() || undefined;
  const nsRaw = typeof o.narrativeStrand === "string" ? o.narrativeStrand : "";
  const narrativeStrand: NarrativeStrand = isNarrativeStrand(nsRaw) ? nsRaw : "principal";
  const crossRaw = o.crossStrandContext ? clampStr(o.crossStrandContext, MAX_CROSS) : "";
  const crossStrandContext = crossRaw.trim() || undefined;
  const nexusRaw = o.worldNexusContext ? clampStr(o.worldNexusContext, MAX_NEXUS) : "";
  const worldNexusContext = nexusRaw.trim() || undefined;

  return {
    codex,
    tirada,
    hambre,
    input,
    recentLogs,
    stream,
    chronicle,
    synapticDisruption,
    ideasRepository,
    narrativeStrand,
    crossStrandContext,
    worldNexusContext,
  };
}
