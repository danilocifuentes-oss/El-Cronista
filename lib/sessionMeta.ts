const META_KEY = "cronista-meta-v1";
const XP_LOG_KEY = "cronista-xplog-v1";
export const NARRATOR_KEY = "cronista-narrator";
export const BLOOD_CIPHER = "112358";

export type SessionMeta = {
  sheetLocked: boolean;
  /** Última vez que el Reloj Mnemósine aumentó Hambre */
  lastFamineTickAt: number;
  /** Intervalo configurable (narrador), en minutos reales */
  famineIntervalMinutes: number;
};

export type XpLogEntry = { ts: number; text: string };

export function loadMeta(): SessionMeta {
  if (typeof window === "undefined") return defaultMeta();
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return defaultMeta();
    const p = JSON.parse(raw) as SessionMeta;
    return {
      sheetLocked: Boolean(p.sheetLocked),
      lastFamineTickAt: typeof p.lastFamineTickAt === "number" ? p.lastFamineTickAt : Date.now(),
      famineIntervalMinutes:
        typeof p.famineIntervalMinutes === "number"
          ? Math.max(5, Math.min(240, p.famineIntervalMinutes))
          : 60,
    };
  } catch {
    return defaultMeta();
  }
}

export function defaultMeta(): SessionMeta {
  return {
    sheetLocked: false,
    lastFamineTickAt: Date.now(),
    famineIntervalMinutes: 60,
  };
}

export function saveMeta(meta: SessionMeta): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export function loadXpLog(): XpLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(XP_LOG_KEY);
    if (!raw) return [];
    const a = JSON.parse(raw) as XpLogEntry[];
    return Array.isArray(a) ? a.slice(-120) : [];
  } catch {
    return [];
  }
}

export function saveXpLog(entries: XpLogEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(XP_LOG_KEY, JSON.stringify(entries.slice(-120)));
}

export function appendXpLog(text: string): XpLogEntry[] {
  const stamp = `[${new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}]`;
  const line = `${stamp} ${text}`;
  const next = [...loadXpLog(), { ts: Date.now(), text: line }];
  saveXpLog(next);
  return next;
}

export function loadNarratorFlag(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(NARRATOR_KEY) === "1";
}

export function saveNarratorFlag(v: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NARRATOR_KEY, v ? "1" : "0");
}
