import type { SoloProgress } from "./types";

const SOLO_PROGRESS_PREFIX = "cronista-solo-progress-v1::";

/** Flags booleanos con valores por defecto al leer save antiguo (o parcial). */
const SOLO_FLAGS_DEFAULTS = {
  clan_intro_seen: false,
  /** Legacy: coexistía con cortina; migra a `chroniclePreludeSeenVersion`. */
  chronicle_curtain_seen: false,
} satisfies Record<string, boolean>;

function normalizeChroniclePreludeSeenVersion(progress: SoloProgress): number {
  const stored = progress.chroniclePreludeSeenVersion;
  if (typeof stored === "number" && Number.isFinite(stored) && stored >= 0) return stored;
  return progress.flags?.chronicle_curtain_seen === true ? 1 : 0;
}

function keyForProfileClan(profileId: string, clan: string): string {
  return `${SOLO_PROGRESS_PREFIX}${profileId}::${clan}`;
}

function legacyKeyForProfile(profileId: string): string {
  return `${SOLO_PROGRESS_PREFIX}${profileId}`;
}

export function loadSoloProgress(profileId: string, clan: string): SoloProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(keyForProfileClan(profileId, clan));
    const legacy = raw ? null : localStorage.getItem(legacyKeyForProfile(profileId));
    const source = raw ?? legacy;
    if (!source) return null;
    const parsed = JSON.parse(source) as SoloProgress;
    if (parsed.version !== 1) return null;
    if (!parsed.profileId || parsed.profileId !== profileId) return null;
    if (!parsed.clan || parsed.clan !== clan) return null;
    if (!parsed.chapterId || !parsed.sceneId) return null;
    const merged: SoloProgress = {
      ...parsed,
      chapterContextSeen:
        parsed.chapterContextSeen &&
        typeof parsed.chapterContextSeen === "object" &&
        parsed.chapterContextSeen !== null
          ? parsed.chapterContextSeen
          : {},
      flags: { ...SOLO_FLAGS_DEFAULTS, ...(parsed.flags ?? {}) },
      visitedSceneIds: Array.isArray(parsed.visitedSceneIds) ? parsed.visitedSceneIds : [],
      soloSceneBackStack: Array.isArray(parsed.soloSceneBackStack)
        ? parsed.soloSceneBackStack.filter(
            (x): x is { chapterId: string; sceneId: string } =>
              Boolean(x) && typeof x.chapterId === "string" && typeof x.sceneId === "string",
          )
        : [],
      decisionHistory: Array.isArray(parsed.decisionHistory) ? parsed.decisionHistory : [],
      reputation: typeof parsed.reputation === "number" ? parsed.reputation : 0,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
    };
    merged.chroniclePreludeSeenVersion = normalizeChroniclePreludeSeenVersion(merged);
    /** Reescribe save si venía sólo del boolean legacy (`chronicle_curtain_seen`) sin número. */
    if (parsed.chroniclePreludeSeenVersion === undefined) {
      queueMicrotask(() => saveSoloProgress(merged));
    }
    return merged;
  } catch {
    return null;
  }
}

export function saveSoloProgress(progress: SoloProgress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(keyForProfileClan(progress.profileId, progress.clan), JSON.stringify(progress));
}

export function clearSoloProgress(profileId: string, clan: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(keyForProfileClan(profileId, clan));
}
