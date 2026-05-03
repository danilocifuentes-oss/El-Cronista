/**
 * Nexo arrival: primera capa narrativa siempre desde el motor interno (sin cuota IA),
 * con anclas comunes desde Génesis + CODEX activo + siluetas selladas del registro jugador.
 */

import type { CharacterSheet } from "@/lib/character";
import type { ChronicleConfig } from "@/lib/chronicleConfig";
import { generateInternalNarrador } from "@/lib/narrativeDrivers/internalNarrador";
import { filterLogsByStrand } from "@/lib/narrativeMemory";
import type { NarradorRequestBody, NarrativeLogEntry } from "@/lib/narrativeTypes";
import type { NarrativeStrand } from "@/lib/narrativeStrands";
import type { NexusWorldState } from "@/lib/nexusWorldState";
import { loadBundle, listProfiles } from "@/lib/profileStore";
import { buildSheetSummaryLite } from "@/lib/sheetSummary";

let primeInFlight = false;

export function acquireNexoPrimeLock(): boolean {
  if (primeInFlight) return false;
  primeInFlight = true;
  return true;
}

export function releaseNexoPrimeLock(): void {
  primeInFlight = false;
}

const PLACEHOLDER_SUBSTRINGS = ["todavía no hay ninguna marca", "todavÍa no hay ninguna marca"];

function isPlaceholderNarration(text: string): boolean {
  const t = text.trim().toLowerCase();
  return t.length === 0 || PLACEHOLDER_SUBSTRINGS.some((s) => t.includes(s));
}

/** ¿Falta pie narradora real en este hilo? (principal = Nexo común donde pesa coordinación MJ). */
export function nexoNeedsNarrativePriming(entries: NarrativeLogEntry[], strand: NarrativeStrand): boolean {
  if (strand !== "principal") return false;
  const scoped = filterLogsByStrand(entries, strand);
  const narratorLines = scoped.filter((e) => e.role === "narrador" && !(e.id === "0"));
  if (narratorLines.length === 0) return true;
  return narratorLines.every((e) => isPlaceholderNarration(e.text));
}

/** Quita entrada placeholder antigua (`id === "0"`). */
export function stripBootPlaceholder(entries: NarrativeLogEntry[]): NarrativeLogEntry[] {
  return entries.filter((e) => !(e.role === "narrador" && e.id === "0"));
}

function clip(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/** Hilos jugables en común: linajes repetidos y conceptos cercanos entre sellados jugador (no NPC). */
export function resonanceFromPeerCodexes(activeProfileId: string | null): string {
  const idx = listProfiles().filter((p) => !p.isNPC && p.id !== activeProfileId);
  if (!idx.length) return "";

  const clans = new Map<string, number>();
  const concepts: string[] = [];
  let sealed = 0;

  for (const p of idx.slice(0, 14)) {
    const b = loadBundle(p.id);
    if (!b) continue;
    if (!b.meta.sheetLocked) continue;
    sealed += 1;
    const c = (b.sheet.clan ?? "").trim();
    if (c) clans.set(c, (clans.get(c) ?? 0) + 1);
    const cx = clip(b.sheet.concept ?? "", 120);
    if (cx) concepts.push(cx);
  }

  if (sealed === 0) {
    return `Mesa provisional: otros PJ registrados sin CODEX cerrado; el tono público puede cristalizar contigo.`;
  }

  const topClans = [...clans.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
  const clanLine =
    topClans.length === 0
      ? ""
      : `Presencia camarilla dispersa (${topClans.map(([k, n]) => `${k}×${n}`).join(", ")}).`;

  const conceptHint =
    concepts.length >= 2
      ? `Motivos paralelos (${concepts.slice(0, 2).join(" · ")}) sugieren vectores donde la ciudad ya os estaba midiendo antes de esta noche visible.`
      : concepts.length === 1
        ? `Otro sellado navega tema afín: «${clip(concepts[0]!, 180)}».`
        : "";

  const countLine = sealed === 1 ? "Hay otro inmortal sellado registrado como jugable." : `Hay ${sealed} vampiros jugables sellados además del tuyo.`;

  return [countLine, clanLine, conceptHint].filter(Boolean).join("\n\n");
}

/**
 * Sintetiza llegada umbral: tiempo vivido atrás pero “comienzo de escena”; no tutorial literal.
 */
export function buildSyntheticArrivalAction(
  sheet: CharacterSheet,
  chronicle: ChronicleConfig | undefined,
  tableResonance: string,
  world: NexusWorldState,
): string {
  const anchors = clip(chronicle?.foundations ?? "", 420);
  const beat = clip(world.lastBeat, 380);
  const concept = clip(sheet.concept ?? sheet.name ?? "", 160);
  const reso = clip((sheet.resonance ?? "").toString(), 80);

  const lines = [
    "Interior · no es onboarding: llevas décadas o más en Sangre.",
    `Hoy reaplico atención al presente nexo donde ${concept || "tu silueta"} toca la ciudad.`,
    resonanceToneLine(reso),
    anchors ? `Cimientos de mesa (${anchors})` : "",
    beat ? `Continuidad de mundo nexo (${beat})` : "",
    tableResonance ? `Resonancia con otros CODEX (${tableResonance})` : "",
    "Pidamos el mismo viento térmico: Segunda Inquisición como rumor háptico más que folklore; Santiago gótico-punk húmedo.",
    "Necesito la escena YA: presión urbana cercana sin infodump; segunda persona visceral donde encaje.",
  ];
  return lines.filter(Boolean).join("\n");
}

function resonanceToneLine(reso: string): string {
  if (!reso) return "Tu resonancia con la presa modela qué esquinas del mapa te reclaman primero.";
  return `Tu resonancia declarada (${reso}) tira de la ciudad hacia texturas concretas antes que hacia el genérico.`;
}

/** Cuerpo mínimo coherente con el narrador Gemini/interno. */
export function buildArrivalNarradorPayload(args: {
  sheet: CharacterSheet;
  chronicle: ChronicleConfig | undefined;
  strand: NarrativeStrand;
  inquisitionThreat: number;
  worldState: NexusWorldState;
  worldNexusPrompt: string;
  rollingSummary?: string;
  activeProfileId: string | null;
}): NarradorRequestBody {
  const tableResonance = resonanceFromPeerCodexes(args.activeProfileId);
  const playerAction = buildSyntheticArrivalAction(args.sheet, args.chronicle, tableResonance, args.worldState);

  const chronPayload = args.chronicle
    ? {
        foundations: args.chronicle.foundations,
        AMBIENTE: args.chronicle.AMBIENTE,
        TENSION: args.chronicle.TENSION,
        ESTADO_GLOBAL: args.chronicle.ESTADO_GLOBAL,
        VINCULO_HILOS: args.chronicle.VINCULO_HILOS,
      }
    : undefined;

  return {
    playerAction,
    recentLogs: [{ role: "sistema", text: "[ARRIBO_INTERIOR]: CODEX cerrado · umbral Nexo principal." }],
    sheetSummary: buildSheetSummaryLite(args.sheet),
    inquisitionThreat: Math.max(0, Math.min(5, Math.round(args.inquisitionThreat))),
    mjDirectives: [],
    ...(args.rollingSummary?.trim() ? { rollingSummary: args.rollingSummary.trim().slice(0, 3800) } : {}),
    chronicle: chronPayload,
    narrativeStrand: args.strand,
    worldNexusContext: args.worldNexusPrompt,
  };
}

/** Genera apertura inmersiva (interno únicamente aquí por política UX/cuota). */
export function synthesizeInternalArrivalScene(body: NarradorRequestBody): {
  narracion: string;
  suggestions?: string[];
  resumen_actualizado?: string;
} {
  return generateInternalNarrador(body);
}
