import type { NarrativeLogEntry } from "@/lib/narrativeTypes";
import {
  defaultRollingByStrand,
  normalizeRollingByStrand,
  normalizeStrand,
  type NarrativeStrand,
  type RollingByStrand,
} from "@/lib/narrativeStrands";

const LOG_KEY = "cronista-narrative-log-v1";
const SUMMARY_KEY = "cronista-narrative-summary-v1";
const ROLLING_BY_STRAND_KEY = "cronista-rolling-by-strand-v1";
const ACTIVE_STRAND_KEY = "cronista-active-strand-v1";
const MJ_KEY = "cronista-mj-directives-v1";
const IDEAS_KEY = "cronista-ideas-repo-v1";

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
        const strand = normalizeStrand((row as NarrativeLogEntry).strand);
        const rawSug = (row as NarrativeLogEntry).suggestions;
        const suggestions =
          Array.isArray(rawSug) && rawSug.every((x) => typeof x === "string")
            ? rawSug.map((s) => s.trim()).filter(Boolean).slice(0, 8)
            : undefined;
        out.push({
          id: (row as NarrativeLogEntry).id,
          role,
          text: (row as NarrativeLogEntry).text,
          ts: (row as NarrativeLogEntry).ts,
          strand,
          ...(cronistaOut ? { cronistaOut: true } : {}),
          ...(suggestions?.length ? { suggestions } : {}),
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

/** Log completo; usar `filterLogsByStrand` para la vista por hilo. */
export function filterLogsByStrand(entries: NarrativeLogEntry[], strand: NarrativeStrand): NarrativeLogEntry[] {
  return entries.filter((e) => normalizeStrand(e.strand) === strand);
}

function migrateRollingFromLegacyIfNeeded(): RollingByStrand {
  const next = defaultRollingByStrand();
  try {
    const raw = localStorage.getItem(ROLLING_BY_STRAND_KEY);
    if (raw) {
      return normalizeRollingByStrand(JSON.parse(raw));
    }
    const leg = localStorage.getItem(SUMMARY_KEY);
    if (leg?.trim()) {
      next.principal = leg.trim().slice(0, 2000);
    }
  } catch {
    /* ignore */
  }
  return next;
}

export function loadRollingByStrand(): RollingByStrand {
  if (typeof window === "undefined") return defaultRollingByStrand();
  try {
    const raw = localStorage.getItem(ROLLING_BY_STRAND_KEY);
    if (!raw) {
      const migrated = migrateRollingFromLegacyIfNeeded();
      localStorage.setItem(ROLLING_BY_STRAND_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return normalizeRollingByStrand(JSON.parse(raw));
  } catch {
    return defaultRollingByStrand();
  }
}

export function saveRollingByStrand(r: RollingByStrand): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROLLING_BY_STRAND_KEY, JSON.stringify(normalizeRollingByStrand(r)));
}

export function loadActiveStrand(): NarrativeStrand {
  if (typeof window === "undefined") return "principal";
  try {
    const s = localStorage.getItem(ACTIVE_STRAND_KEY);
    return normalizeStrand(s);
  } catch {
    return "principal";
  }
}

export function saveActiveStrand(strand: NarrativeStrand): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_STRAND_KEY, strand);
}

/** Resumen del hilo actualmente seleccionado (compatibilidad con APIs que esperaban un solo resumen). */
export function loadRollingSummary(): string {
  const strand = loadActiveStrand();
  return loadRollingByStrand()[strand] ?? "";
}

export function saveRollingSummary(text: string): void {
  const strand = loadActiveStrand();
  const rb = loadRollingByStrand();
  rb[strand] = text.trim().slice(0, 2000);
  saveRollingByStrand(rb);
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

const MAX_IDEAS_STORE = 12000;

export function loadIdeasRepository(): string {
  if (typeof window === "undefined") return "";
  try {
    const s = localStorage.getItem(IDEAS_KEY);
    return typeof s === "string" ? s.slice(0, MAX_IDEAS_STORE) : "";
  } catch {
    return "";
  }
}

export function saveIdeasRepository(text: string): void {
  if (typeof window === "undefined") return;
  const t = text.trim().slice(0, MAX_IDEAS_STORE);
  if (!t) {
    localStorage.removeItem(IDEAS_KEY);
    return;
  }
  localStorage.setItem(IDEAS_KEY, t);
}

export type NarrativeResetOptions = {
  clearIdeas?: boolean;
  clearMj?: boolean;
  /** Si se indica, solo vacía entradas y resumen de ese hilo. */
  strandOnly?: NarrativeStrand;
};

export function resetNarrativeChannel(opts?: NarrativeResetOptions): NarrativeLogEntry[] {
  if (opts?.strandOnly) {
    const only = opts.strandOnly;
    const prev = loadNarrativeLog();
    const filtered = prev.filter((e) => normalizeStrand(e.strand) !== only);
    const rb = loadRollingByStrand();
    rb[only] = "";
    saveRollingByStrand(rb);
    const boot: NarrativeLogEntry = {
      id: `boot_${Date.now()}`,
      role: "narrador",
      text: "Aquí empieza otra página de esta noche.",
      ts: Date.now(),
      strand: only,
    };
    const next = [...filtered, boot];
    saveNarrativeLog(next);
    return next;
  }

  const boot: NarrativeLogEntry = {
    id: `boot_${Date.now()}`,
    role: "narrador",
    text: "La página queda abierta esperando nuevo calor.",
    ts: Date.now(),
    strand: loadActiveStrand(),
  };
  saveNarrativeLog([boot]);
  saveRollingByStrand(defaultRollingByStrand());
  if (opts?.clearMj) clearMjDirectives();
  if (opts?.clearIdeas) {
    try {
      localStorage.removeItem(IDEAS_KEY);
    } catch {
      /* ignore */
    }
  }
  return [boot];
}

/** Últimas líneas del mismo hilo para el motor (rol/texto). */
export function recentLinesForStrand(
  entries: NarrativeLogEntry[],
  strand: NarrativeStrand,
  maxTurns: number,
): { role: string; text: string }[] {
  const slice = filterLogsByStrand(entries, strand).slice(-maxTurns);
  return slice.map(({ role, text }) => ({ role, text }));
}
