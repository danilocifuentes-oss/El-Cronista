import type { NarrativeLogEntry } from "@/lib/narrativeTypes";
import type { CampaignWireEntry } from "@/lib/campaignTypes";
import type { NarradorRecentLine } from "@/lib/narrativeTypes";

/** Incorpora entradas remotas que aún no existen en el log local (por `id`). */
export function mergeCampaignIntoLog(prev: NarrativeLogEntry[], remote: CampaignWireEntry[]): NarrativeLogEntry[] {
  const ids = new Set(prev.map((e) => e.id));
  const additions: NarrativeLogEntry[] = remote
    .filter((e) => e.id && !ids.has(e.id))
    .map((e) => ({
      id: e.id,
      ts: e.ts,
      role: e.role,
      text: e.text,
      strand: e.strand,
    }));
  if (!additions.length) return prev;
  return [...prev, ...additions].sort((a, b) => a.ts - b.ts).slice(-200);
}

/** Cola Schreck para el modelo: mismo hilo, etiqueta de jugador en prefijo para lectura mesa grupal. */
export function recentLinesFromCampaign(entries: CampaignWireEntry[], strand: string, maxTurns: number): NarradorRecentLine[] {
  const filtered = entries.filter((e) => e.strand === strand);
  const tail = filtered.slice(-maxTurns);
  return tail.map((e) => ({
    role: e.role,
    text: e.playerTag && e.role === "jugador" ? `[${e.playerTag}] ${e.text}` : e.text,
  }));
}
