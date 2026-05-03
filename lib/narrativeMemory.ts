import type { NarrativeLogEntry } from "@/lib/narrativeTypes";

const LOG_KEY = "cronista-narrative-log-v1";
const SUMMARY_KEY = "cronista-narrative-summary-v1";
const MJ_KEY = "cronista-mj-directives-v1";

const MAX_LOG = 200;
const MAX_MJ = 14;

function parseLogs(raw: unknown): NarrativeLogEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: NarrativeLogEntry[] = [];
  for (const row of raw) {
    if (
      row &&
      typeof row === "object" &&
      typeof (row as NarrativeLogEntry).id === "string" &&
      typeof (row as NarrativeLogEntry).text === "string" &&
      typeof (row as NarrativeLogEntry).ts === "number"
    ) {
      const role = (row as NarrativeLogEntry).role;
      if (role === "narrador" || role === "jugador" || role === "sistema") {
        const cronistaOut = Boolean((row as NarrativeLogEntry).cronistaOut);
        out.push({
          id: (row as NarrativeLogEntry).id,
          role,
          text: (row as NarrativeLogEntry).text,
          ts: (row as NarrativeLogEntry).ts,
          ...(cronistaOut ? { cronistaOut: true } : {}),
        });
      }
    }
  }
  return out;
}

export function loadNarrativeLog(): NarrativeLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    return parseLogs(JSON.parse(raw)).slice(-MAX_LOG);
  } catch {
    return [];
  }
}

export function saveNarrativeLog(entries: NarrativeLogEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOG_KEY, JSON.stringify(entries.slice(-MAX_LOG)));
}

export function loadRollingSummary(): string {
  if (typeof window === "undefined") return "";
  try {
    const s = localStorage.getItem(SUMMARY_KEY);
    return typeof s === "string" ? s.slice(0, 2000) : "";
  } catch {
    return "";
  }
}

export function saveRollingSummary(text: string): void {
  if (typeof window === "undefined") return;
  const trimmed = text.trim().slice(0, 2000);
  if (!trimmed) {
    localStorage.removeItem(SUMMARY_KEY);
    return;
  }
  localStorage.setItem(SUMMARY_KEY, trimmed);
}

export function loadMjDirectives(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MJ_KEY);
    if (!raw) return [];
    const a = JSON.parse(raw) as unknown;
    if (!Array.isArray(a)) return [];
    return a
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim())
      .slice(-MAX_MJ);
  } catch {
    return [];
  }
}

export function saveMjDirectives(directives: string[]): void {
  if (typeof window === "undefined") return;
  const next = directives
    .filter((x) => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim())
    .slice(-MAX_MJ);
  localStorage.setItem(MJ_KEY, JSON.stringify(next));
}

export function appendMjDirective(text: string): void {
  const t = text.trim();
  if (!t) return;
  const prev = loadMjDirectives();
  saveMjDirectives([...prev, t]);
}

export function clearMjDirectives(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MJ_KEY);
}
