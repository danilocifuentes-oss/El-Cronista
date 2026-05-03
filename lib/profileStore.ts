import type { CharacterSheet, ClanId } from "@/lib/character";
import {
  emptySheet,
  loadSheet,
  normalizeCharacterSheet,
  saveSheet,
  STORAGE_KEY,
} from "@/lib/character";
import { SHADOW_PACK_SHEETS } from "@/lib/shadowPack";
import {
  loadActiveStrand,
  loadIdeasRepository,
  loadMjDirectives,
  loadNarrativeLog,
  loadRollingByStrand,
  saveActiveStrand,
  saveIdeasRepository,
  saveMjDirectives,
  saveNarrativeLog,
  saveRollingByStrand,
} from "@/lib/narrativeMemory";
import type { NarrativeLogEntry } from "@/lib/narrativeTypes";
import {
  loadMeta,
  loadXpLog,
  normalizeSessionMeta,
  saveMeta,
  saveXpLog,
  type SessionMeta,
  type XpLogEntry,
} from "@/lib/sessionMeta";
import {
  defaultRollingByStrand,
  normalizeRollingByStrand,
  normalizeStrand,
  type NarrativeStrand,
  type RollingByStrand,
} from "@/lib/narrativeStrands";

const INDEX_KEY = "cronista-profile-index-v1";
const BUNDLE_PREFIX = "cronista-profile-bundle-v1::";
const MIGRATION_FLAG = "cronista-migrated-profiles-v1";
const ACTIVE_ID_KEY = "cronista-active-profile-v1";
const MAX_PROFILES = 20;
const SHADOW_PACK_FLAG = "cronista-shadow-pack-seeded-v1";
const LEGACY_GLOBAL_IDEAS_KEY = "cronista-ideas-repo-v1";
const MAX_IDEAS_IN_BUNDLE = 12000;

export type ProfileSummary = {
  id: string;
  name: string;
  clan: ClanId;
  updatedAt: number;
  /** Metadato de índice; la fuente de verdad sigue en `sheet.isNPC`. */
  isNPC?: boolean;
};

type ProfileIndex = {
  profiles: ProfileSummary[];
  lastActiveId: string | null;
};

export type ProfileBundle = {
  version: 1;
  sheet: CharacterSheet;
  meta: SessionMeta;
  xpLog: XpLogEntry[];
  narrativeLog: NarrativeLogEntry[];
  rollingByStrand: RollingByStrand;
  /** Último hilo narrativo seleccionado en el Nexo (principal / paralela / vivo). */
  narrativeStrand: NarrativeStrand;
  mjDirectives: string[];
  /** Repositorio de ideas narrativas (por perfil; la copia activa vive en la clave global hasta el siguiente sync). */
  ideasRepository: string;
};

function newId(): string {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadIndex(): ProfileIndex {
  if (typeof window === "undefined") return { profiles: [], lastActiveId: null };
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return { profiles: [], lastActiveId: null };
    const p = JSON.parse(raw) as ProfileIndex;
    const profiles = Array.isArray(p.profiles)
      ? p.profiles.filter((x) => x && typeof x.id === "string")
      : [];
    return {
      profiles,
      lastActiveId: typeof p.lastActiveId === "string" ? p.lastActiveId : null,
    };
  } catch {
    return { profiles: [], lastActiveId: null };
  }
}

function saveIndex(idx: ProfileIndex): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(INDEX_KEY, JSON.stringify(idx));
}

function bundleKey(id: string): string {
  return `${BUNDLE_PREFIX}${id}`;
}

export function loadBundle(id: string): ProfileBundle | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(bundleKey(id));
    if (!raw) return null;
    const p = JSON.parse(raw) as ProfileBundle;
    if (p.version !== 1 || !p.sheet) return null;
    const metaIn = p.meta as Partial<SessionMeta> | undefined;
    const meta = normalizeSessionMeta(metaIn);
    return {
      version: 1,
      sheet: normalizeCharacterSheet(p.sheet),
      meta,
      xpLog: Array.isArray(p.xpLog) ? p.xpLog : [],
      narrativeLog: Array.isArray(p.narrativeLog) ? p.narrativeLog : [],
      rollingByStrand: ((): RollingByStrand => {
        const raw = p as Record<string, unknown>;
        if (raw.rollingByStrand && typeof raw.rollingByStrand === "object") {
          return normalizeRollingByStrand(raw.rollingByStrand);
        }
        const leg = typeof raw.rollingSummary === "string" ? raw.rollingSummary : "";
        const base = defaultRollingByStrand();
        base.principal = leg ? leg.slice(0, 2000) : "";
        return base;
      })(),
      narrativeStrand: normalizeStrand((p as { narrativeStrand?: unknown }).narrativeStrand),
      mjDirectives: Array.isArray(p.mjDirectives) ? p.mjDirectives : [],
      ideasRepository:
        typeof p.ideasRepository === "string"
          ? p.ideasRepository.slice(0, MAX_IDEAS_IN_BUNDLE)
          : "",
    };
  } catch {
    return null;
  }
}

export function saveBundle(id: string, bundle: ProfileBundle): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(bundleKey(id), JSON.stringify(bundle));
}

export function listProfiles(): ProfileSummary[] {
  return loadIndex().profiles.slice().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getActiveProfileId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_ID_KEY);
}

export function setActiveProfileId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(ACTIVE_ID_KEY, id);
  else localStorage.removeItem(ACTIVE_ID_KEY);
}

/** Lee estado global actual y lo guarda en el bundle del perfil activo. */
export function syncActiveBundleFromGlobals(profileId: string): void {
  const sheet = loadSheet();
  if (!sheet) return;
  const bundle: ProfileBundle = {
    version: 1,
    sheet,
    meta: loadMeta(),
    xpLog: loadXpLog(),
    narrativeLog: loadNarrativeLog(),
    rollingByStrand: loadRollingByStrand(),
    narrativeStrand: loadActiveStrand(),
    mjDirectives: loadMjDirectives(),
    ideasRepository: loadIdeasRepository().slice(0, MAX_IDEAS_IN_BUNDLE),
  };
  saveBundle(profileId, bundle);
  const idx = loadIndex();
  const others = idx.profiles.filter((p) => p.id !== profileId);
  const summary: ProfileSummary = {
    id: profileId,
    name: sheet.name?.trim() || "Sin nombre",
    clan: sheet.clan,
    updatedAt: Date.now(),
    isNPC: Boolean(sheet.isNPC),
  };
  saveIndex({
    profiles: [summary, ...others].slice(0, MAX_PROFILES),
    lastActiveId: profileId,
  });
}

/** Escribe el bundle en las claves globales que usa el resto de la app. */
export function hydrateGlobalsFromBundle(bundle: ProfileBundle): void {
  saveSheet(bundle.sheet);
  saveMeta(bundle.meta);
  saveXpLog(bundle.xpLog);
  saveNarrativeLog(bundle.narrativeLog);
  saveRollingByStrand(bundle.rollingByStrand);
  saveActiveStrand(bundle.narrativeStrand);
  saveMjDirectives(bundle.mjDirectives);

  let ideas = typeof bundle.ideasRepository === "string" ? bundle.ideasRepository : "";
  if (!ideas.trim() && typeof window !== "undefined") {
    try {
      const idx = loadIndex();
      const leg = localStorage.getItem(LEGACY_GLOBAL_IDEAS_KEY)?.trim();
      if (leg && idx.profiles.length === 1) {
        ideas = leg.slice(0, MAX_IDEAS_IN_BUNDLE);
        localStorage.removeItem(LEGACY_GLOBAL_IDEAS_KEY);
        const id = getActiveProfileId();
        if (id) {
          queueMicrotask(() => syncActiveBundleFromGlobals(id));
        }
      }
    } catch {
      /* ignore */
    }
  }
  saveIdeasRepository(ideas);
}

export function migrateLegacyToProfiles(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATION_FLAG)) return;

  const idx = loadIndex();
  if (idx.profiles.length > 0) {
    localStorage.setItem(MIGRATION_FLAG, "1");
    return;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(MIGRATION_FLAG, "1");
    return;
  }

  try {
    const sheet = normalizeCharacterSheet(JSON.parse(raw) as Partial<CharacterSheet>);
    /** Evita recrear un “perfil fantasma” tras reinicio (hoja global vacía sin nombre sellado). */
    if (!sheet.name?.trim() && !sheet.isNPC) {
      localStorage.setItem(MIGRATION_FLAG, "1");
      return;
    }
    const id = newId();
    const bundle: ProfileBundle = {
      version: 1,
      sheet,
      meta: loadMeta(),
      xpLog: loadXpLog(),
      narrativeLog: loadNarrativeLog(),
      rollingByStrand: loadRollingByStrand(),
      narrativeStrand: loadActiveStrand(),
      mjDirectives: loadMjDirectives(),
      ideasRepository: loadIdeasRepository().slice(0, MAX_IDEAS_IN_BUNDLE),
    };
    saveBundle(id, bundle);
    saveIndex({
      profiles: [
        {
          id,
          name: sheet.name?.trim() || "Sin nombre",
          clan: sheet.clan,
          updatedAt: Date.now(),
        },
      ],
      lastActiveId: id,
    });
    setActiveProfileId(id);
  } catch {
    /* vacío */
  }
  localStorage.setItem(MIGRATION_FLAG, "1");
}

export function createBlankProfile(): string {
  let idx = loadIndex();
  while (idx.profiles.length >= MAX_PROFILES) {
    const oldest = [...idx.profiles].sort((a, b) => a.updatedAt - b.updatedAt)[0];
    if (!oldest) break;
    removeProfile(oldest.id);
    idx = loadIndex();
  }

  const id = newId();
  const sheet = emptySheet();
  const meta: SessionMeta = normalizeSessionMeta({
    sheetLocked: false,
    lastFamineTickAt: Date.now(),
    famineIntervalMinutes: loadMeta().famineIntervalMinutes,
  });
  const bundle: ProfileBundle = {
    version: 1,
    sheet,
    meta,
    xpLog: [],
    narrativeLog: [],
    rollingByStrand: defaultRollingByStrand(),
    narrativeStrand: "principal",
    mjDirectives: [],
    ideasRepository: "",
  };
  saveBundle(id, bundle);
  saveIndex({
    profiles: [
      {
        id,
        name: "Nuevo",
        clan: sheet.clan,
        updatedAt: Date.now(),
      },
      ...idx.profiles.filter((p) => p.id !== id),
    ].slice(0, MAX_PROFILES),
    lastActiveId: id,
  });
  setActiveProfileId(id);
  hydrateGlobalsFromBundle(bundle);
  return id;
}

/** Borra índice, bundles activos y marcas NPC semilla locales. No borra Génesis (`chronicleConfig`). */
/** Marca migración como hecha sin crear perfil (p. ej. hoja global vacía tras limpieza). */
export function markProfileRegistryClean(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MIGRATION_FLAG, "1");
}

/** Borra sólo personajes del hub + hoja activa; no borra Génesis, log Nexo ni mundo cliente. */
export function clearLocalPlayerProfilesOnly(): void {
  wipeAllLocalProfiles();
  saveSheet(emptySheet());
  markProfileRegistryClean();
}

export function wipeAllLocalProfiles(): void {
  if (typeof window === "undefined") return;
  const idx = loadIndex();
  for (const p of idx.profiles) {
    localStorage.removeItem(bundleKey(p.id));
  }
  /** Cualquier bundle huérfano (índice corrupto o migraciones viejas). */
  try {
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const k = localStorage.key(i);
      if (k?.startsWith(BUNDLE_PREFIX)) localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
  saveIndex({ profiles: [], lastActiveId: null });
  setActiveProfileId(null);
  try {
    localStorage.removeItem(MIGRATION_FLAG);
    localStorage.removeItem(SHADOW_PACK_FLAG);
    localStorage.removeItem(LEGACY_GLOBAL_IDEAS_KEY);
  } catch {
    /* ignore */
  }
}

export function removeProfile(id: string): void {
  const idx = loadIndex();
  const nextProfiles = idx.profiles.filter((p) => p.id !== id);
  localStorage.removeItem(bundleKey(id));
  let lastActive = idx.lastActiveId;
  if (lastActive === id) lastActive = nextProfiles[0]?.id ?? null;
  saveIndex({ profiles: nextProfiles, lastActiveId: lastActive });
  if (getActiveProfileId() === id) setActiveProfileId(lastActive);
}

export function selectProfile(id: string): boolean {
  const current = getActiveProfileId();
  if (current) syncActiveBundleFromGlobals(current);
  const bundle = loadBundle(id);
  if (!bundle) return false;
  setActiveProfileId(id);
  hydrateGlobalsFromBundle(bundle);
  saveIndex({ ...loadIndex(), lastActiveId: id });
  return true;
}

/** Crea un perfil vacío etiquetado como jugador o NPC (sin semilla Shadow Pack). */
export function createProfileEntity(isNPC: boolean): string {
  let idx = loadIndex();
  while (idx.profiles.length >= MAX_PROFILES) {
    const oldest = [...idx.profiles].sort((a, b) => a.updatedAt - b.updatedAt)[0];
    if (!oldest) break;
    removeProfile(oldest.id);
    idx = loadIndex();
  }

  const id = newId();
  const sheet = emptySheet();
  sheet.name = isNPC ? "Nuevo NPC" : "Nuevo sujeto";
  sheet.isNPC = isNPC;
  if (isNPC) {
    sheet.concept = "NPC · borrador operador.";
  }
  const norm = normalizeCharacterSheet(sheet);
  const meta: SessionMeta = normalizeSessionMeta({
    sheetLocked: false,
    lastFamineTickAt: Date.now(),
    famineIntervalMinutes: loadMeta().famineIntervalMinutes,
  });
  const bundle: ProfileBundle = {
    version: 1,
    sheet: norm,
    meta,
    xpLog: [],
    narrativeLog: [],
    rollingByStrand: defaultRollingByStrand(),
    narrativeStrand: "principal",
    mjDirectives: [],
    ideasRepository: "",
  };
  saveBundle(id, bundle);
  saveIndex({
    profiles: [
      {
        id,
        name: norm.name?.trim() || "Sin nombre",
        clan: norm.clan,
        updatedAt: Date.now(),
        isNPC,
      },
      ...idx.profiles.filter((p) => p.id !== id),
    ].slice(0, MAX_PROFILES),
    lastActiveId: id,
  });
  setActiveProfileId(id);
  hydrateGlobalsFromBundle(bundle);
  return id;
}

/** Los tres NPC del Shadow Pack (idempotente). */
export function ensureShadowPackNpcs(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SHADOW_PACK_FLAG)) return;

  const fam = loadMeta().famineIntervalMinutes;
  const idxStart = loadIndex();
  const extra: ProfileSummary[] = [];

  for (const template of SHADOW_PACK_SHEETS) {
    const id = newId();
    const norm = normalizeCharacterSheet(template);
    const meta: SessionMeta = normalizeSessionMeta({
      sheetLocked: true,
      lastFamineTickAt: Date.now(),
      famineIntervalMinutes: typeof fam === "number" ? Math.max(5, Math.min(240, fam)) : 60,
    });
    const bundle: ProfileBundle = {
      version: 1,
      sheet: norm,
      meta,
      xpLog: [],
      narrativeLog: [],
      rollingByStrand: defaultRollingByStrand(),
      narrativeStrand: "principal",
      mjDirectives: [],
      ideasRepository: "",
    };
    saveBundle(id, bundle);
    extra.push({
      id,
      name: norm.name?.trim() || "NPC",
      clan: norm.clan,
      updatedAt: Date.now(),
      isNPC: true,
    });
  }

  saveIndex({
    profiles: [...extra, ...idxStart.profiles].slice(0, MAX_PROFILES),
    lastActiveId: idxStart.lastActiveId,
  });
  localStorage.setItem(SHADOW_PACK_FLAG, "1");
}

/** Persiste un bundle ya construido (p. ej. edición maestro) y refresca el índice. */
export function saveProfileBundle(profileId: string, bundle: ProfileBundle): void {
  saveBundle(profileId, bundle);
  const idx = loadIndex();
  const others = idx.profiles.filter((p) => p.id !== profileId);
  const summary: ProfileSummary = {
    id: profileId,
    name: bundle.sheet.name?.trim() || "Sin nombre",
    clan: bundle.sheet.clan,
    updatedAt: Date.now(),
    isNPC: Boolean(bundle.sheet.isNPC),
  };
  saveIndex({
    profiles: [summary, ...others].slice(0, MAX_PROFILES),
    lastActiveId: idx.lastActiveId,
  });
}
