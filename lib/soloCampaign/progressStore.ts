import type { SoloProgress } from "./types";

const SOLO_PROGRESS_PREFIX = "cronista-solo-progress-v1::";

/** Flags booleanos con valores por defecto al leer save antiguo (o parcial). */
const SOLO_FLAGS_DEFAULTS = {
  clan_intro_seen: false,
  chronicle_curtain_seen: false,
} satisfies Record<string, boolean>;

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
    return {
      ...parsed,
      flags: { ...SOLO_FLAGS_DEFAULTS, ...(parsed.flags ?? {}) },
      visitedSceneIds: Array.isArray(parsed.visitedSceneIds) ? parsed.visitedSceneIds : [],
      decisionHistory: Array.isArray(parsed.decisionHistory) ? parsed.decisionHistory : [],
      reputation: typeof parsed.reputation === "number" ? parsed.reputation : 0,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
    };
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
