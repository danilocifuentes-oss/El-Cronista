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
    return `Arriba el rumor de otros nombres registrados, pero aún sin cerrar el trato con la noche; vos podés ser el primero en afirmar cómo suena la ciudad.`;
  }

  const topClans = [...clans.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
  const clanLine =
    topClans.length === 0
      ? ""
      : `Se adivina repetición de linaje en el registro (${topClans.map(([k, n]) => `${k}×${n}`).join(", ")}): el barrio ya aprendió patrones de sed.`;

  const conceptHint =
    concepts.length >= 2
      ? `Historias que se cruzan antes de verse: ${concepts.slice(0, 2).join(" · ")} — la calle podría estar calculando el mismo choque que vos.`
      : concepts.length === 1
        ? `Algún otro nombre arrastra un deseo parecido al tuyo: «${clip(concepts[0]!, 180)}».`
        : "";

  const countLine =
    sealed === 1
      ? "Hay otro vampiro activo además tuyo — el mapa ya no es solamente tuyo cuando cruzás la esquina."
      : `Hay ${sealed} otros como vos con identidad sellada; la ciudad reparte testigos entre vosotros antes de que nadie hable.`;

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
    "No es tu primera noche; el tiempo en Sangre ya te dejó cicatrices operativas antes de este instante.",
    `Reenfocás el ahora ${concept ? `donde «${concept}» marca tu sombra` : "con la ciudad pegada a los hombros"}.`,
    resonanceToneLine(reso),
    anchors ? `Lo acordado sobre el mundo (${anchors})` : "",
    beat ? `Lo que ya se movió antes de que abrieras los ojos (${beat})` : "",
    tableResonance ? `Ecos de otros en el registro: ${tableResonance}` : "",
    "Mantené la Inquisición como peso en el aire, rumor en la piel; Santiago húmedo, neón viejo, hierro y comercio que no duerme.",
    "Abrí escena inmediata: calles y cuerpos cercanos, segunda persona; nada de prólogos didácticos ni etiquetas de modo.",
  ];
  return lines.filter(Boolean).join("\n");
}

function resonanceToneLine(reso: string): string {
  if (!reso) return "La marca de lo que bebés ordena qué esquinas sentís primero antes que el resto.";
  return `Lo que declaraste como resonancia (${reso}) tira el relato hacia ciertos olores y luces antes que hacia el neutro.`;
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
    /** El modelo no necesita eco «sistema»; el propio playerAction y la ficha bastan. */
    recentLogs: [],
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
