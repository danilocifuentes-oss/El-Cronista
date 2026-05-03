/**
 * Estado de campaña compartido (localStorage global al navegador, alineado con Génesis).
 * Ancle continuidad: evita repetir siempre una “primera noche”; alimenta misiones y el motor.
 */

import type { NarrativeStrand } from "@/lib/narrativeStrands";

const STORAGE_KEY = "cronista-nexus-world-v1";

export type QuestPhase = "latente" | "activa" | "resuelta" | "fallida";

export type MainQuestBeat = {
  id: string;
  /** Título visible para MJ/jugadores */
  title: string;
  /** Qué debe honrar el motor (spoiler táctico, no lore enciclopédico) */
  briefing: string;
  phase: QuestPhase;
  /** Dónde pesa más: arco público vs incursión privada */
  strandHint: NarrativeStrand | "cualquiera";
};

export type NexusWorldState = {
  version: 1;
  /** Etiqueta libre ej. «Post-concilio · noche húmeda» */
  eraLabel: string;
  /** Eco acumulado del mundo (~hechos que deben pesar después) */
  lastBeat: string;
  /** Marcadores diegéticos opcionales (rumores instalados, etc.) */
  worldFlags: string[];
  /** 1 línea principal + satélites; el motor usa las activas */
  mainQuestLine: MainQuestBeat[];
  updatedAt: number;
};

function defaultQuests(): MainQuestBeat[] {
  return [
    {
      id: "mq-sombra-ciudad",
      title: "Sombra que cobra forma",
      briefing:
        "La ciudad lleva cicatrices vivas por decisiones previas — avanza causa/efecto; no resets genéricos. NPC con agendas propias pueden presionar.",
      phase: "activa",
      strandHint: "principal",
    },
    {
      id: "mq-incursion-red",
      title: "Cable caliente",
      briefing:
        "Incursiones paralelas cortas: consecuencias personales rápidas, sin igualar necesariamente la escena grupal.",
      phase: "latente",
      strandHint: "paralela",
    },
  ];
}

export function defaultNexusWorldState(): NexusWorldState {
  return {
    version: 1,
    eraLabel: "Crónica en marcha — el Nexo registra noches vividas.",
    lastBeat: "",
    worldFlags: [],
    mainQuestLine: defaultQuests(),
    updatedAt: Date.now(),
  };
}

export function loadNexusWorldState(): NexusWorldState {
  if (typeof window === "undefined") return defaultNexusWorldState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultNexusWorldState();
    const p = JSON.parse(raw) as Partial<NexusWorldState>;
    const d = defaultNexusWorldState();
    const mainQuestLine = Array.isArray(p.mainQuestLine)
      ? p.mainQuestLine
          .map((q): MainQuestBeat | null => {
            if (!q || typeof q !== "object") return null;
            const o = q as Record<string, unknown>;
            const id = typeof o.id === "string" ? o.id.trim() : "";
            const title = typeof o.title === "string" ? o.title.trim() : "";
            const briefing = typeof o.briefing === "string" ? o.briefing.trim() : "";
            const strandHint = normalizeStrandHint(o.strandHint);
            const phase = normalizePhase(o.phase);
            if (!id || !title) return null;
            return { id, title, briefing, phase, strandHint };
          })
          .filter((x): x is MainQuestBeat => Boolean(x))
      : d.mainQuestLine;
    return {
      version: 1,
      eraLabel:
        typeof p.eraLabel === "string" && p.eraLabel.trim() ? p.eraLabel.trim().slice(0, 280) : d.eraLabel,
      lastBeat: typeof p.lastBeat === "string" ? p.lastBeat.trim().slice(0, 2000) : "",
      worldFlags: Array.isArray(p.worldFlags)
        ? (p.worldFlags as unknown[])
            .map((x) => (typeof x === "string" ? x.trim().slice(0, 120) : ""))
            .filter(Boolean)
            .slice(0, 22)
        : [],
      mainQuestLine: mainQuestLine.length ? mainQuestLine : defaultQuests(),
      updatedAt: typeof p.updatedAt === "number" ? p.updatedAt : Date.now(),
    };
  } catch {
    return defaultNexusWorldState();
  }
}

export function saveNexusWorldState(s: NexusWorldState): void {
  if (typeof window === "undefined") return;
  const next = { ...s, updatedAt: Date.now(), version: 1 as const };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function ingestRollingSummary(prev: NexusWorldState, rollingSummary?: string): NexusWorldState {
  const slice = rollingSummary?.trim()?.slice(0, 520);
  if (!slice) return prev;
  const merged = prev.lastBeat ? `${prev.lastBeat} ·⇢· ${slice}` : slice;
  const lastBeat =
    merged.length > 1400 ? `…${merged.slice(-(1400 - 1))}` : merged;
  return { ...prev, lastBeat, updatedAt: Date.now() };
}

function normalizePhase(x: unknown): QuestPhase {
  if (x === "latente" || x === "activa" || x === "resuelta" || x === "fallida") return x;
  return "latente";
}

function normalizeStrandHint(x: unknown): MainQuestBeat["strandHint"] {
  if (x === "principal" || x === "paralela" || x === "vivo") return x;
  if (x === "cualquiera") return "cualquiera";
  return "cualquiera";
}

export function formatWorldNexusPromptBlock(state: NexusWorldState, strand: NarrativeStrand): string {
  const modo =
    strand === "paralela"
      ? "MODO INCURSIÓN (paralela): escenas más acotadas y rápidas; perspectiva subjetiva ESTRICTA del personaje cuya ficha recibes; no replique la mesa grupal salvo cuando el texto del jugador cite hechos públicos."
      : strand === "vivo"
        ? "MODO MESA FÍSICA (en vivo): continuidad de mesa cara a cara; consecuencias compartidas inmediatas."
        : "MODO MESA GRUPAL (principal): consecuencias con peso público; turnos implícitos; otros vampiros jugables existen — narra desde la subjetividad de ESTE PJ (no omnisciencia total).";

  const activas = state.mainQuestLine
    .filter((q) => q.phase === "activa" || q.phase === "latente")
    .filter((q) => q.strandHint === "cualquiera" || q.strandHint === strand)
    .slice(0, 6);

  const questBlock = activas.length
    ? activas
        .map((q) => `· [${q.phase}] ${q.title}: ${q.briefing.slice(0, 220)}${q.briefing.length > 220 ? "…" : ""}`)
        .join("\n")
    : "";

  const flags =
    state.worldFlags.length > 0 ? `Marcadores diegéticos: ${state.worldFlags.slice(0, 16).join(" · ")}` : "";

  const beat = state.lastBeat.trim()
    ? `Ecos persistentes del mundo (honrar; no reiniciar campaña genérica si esto ya muestra historia):\n${state.lastBeat.trim().slice(0, 900)}`
    : "";

  const chunks = [
    modo,
    `Era / fase narrativa: ${state.eraLabel}`,
    beat,
    flags,
    questBlock ? `Línea misional y arcos (priorizar coherencia, ramificar posibles desenlaces):\n${questBlock}` : "",
    "Directriz: los jugadores son personas y vampiros jugables; los NPC deben sentirse vivos (voz, amenaza, interés) sin confundirlos con el PJ.",
    "Directriz: no forzar la misma escena de bienvenida / «primera noche» si el contexto y el resumen indican continuidad.",
  ];
  return chunks.filter(Boolean).join("\n\n");
}
