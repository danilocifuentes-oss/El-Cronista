import type { DisciplineKey } from "@/lib/sereno";
import { CONCEPTOS_DATA, inferConceptPresetIdFromNombre } from "@/lib/conceptosCodex";
import {
  CLAN_DISCIPLINE_TRIO,
  defaultSerenoSkills,
  defaultAllDisciplines,
  type Generation,
  bloodPotencyForGeneration,
  migrateSkillsFromLegacy,
} from "@/lib/sereno";
import { coerceClassicAttrPresetForClan } from "@/lib/serenoClassic";

export type ClanId =
  | "ventrue"
  | "nosferatu"
  | "brujah"
  | "toreador"
  | "malkavian"
  | "gangrel"
  | "tremere"
  | "thin_blood"
  | "caitiff"
  | "other";

export type { Generation, DisciplineKey };
export type SkillDistributionMode = "jack" | "specialist";

export const CLAN_OPTIONS: { id: ClanId; label: string }[] = [
  { id: "ventrue", label: "Ventrue" },
  { id: "nosferatu", label: "Nosferatu" },
  { id: "brujah", label: "Brujah" },
  { id: "toreador", label: "Toreador" },
  { id: "malkavian", label: "Malkavian" },
  { id: "gangrel", label: "Gangrel" },
  { id: "tremere", label: "Tremere" },
  { id: "thin_blood", label: "Thin-blood" },
  { id: "caitiff", label: "Caitiff" },
  { id: "other", label: "LIN_IND" },
];

/** Acents por clan (UI CODEX · linaje enfoca hsl del nexo). */
export const CLAN_ACCENTS: Record<ClanId, string> = {
  ventrue: "#b89a52",
  nosferatu: "#5a6e52",
  brujah: "#b54a26",
  toreador: "#a85a82",
  malkavian: "#4aaeb0",
  gangrel: "#6d4f36",
  tremere: "#3d4db5",
  thin_blood: "#3d9faa",
  caitiff: "#7e8899",
  other: "#3d8840",
};

export type AttributePhysKey = "str" | "dex" | "sta";
export type AttributeSocKey = "cha" | "man" | "com";
export type AttributeMenKey = "int" | "wit" | "res";

/** Columnas fís / soc / mental (compartidas V5 UI y modo clásico). */
export const ATTR_BAND_KEYS: Record<
  "fis" | "soc" | "men",
  readonly (AttributePhysKey | AttributeSocKey | AttributeMenKey)[]
> = {
  fis: ["str", "dex", "sta"],
  soc: ["cha", "man", "com"],
  men: ["int", "wit", "res"],
};

/** Agrupación visual CODEX (`//_FÍS` …). */
export const ATTRIBUTE_BANDS: readonly {
  label: string;
  keys: readonly (AttributePhysKey | AttributeSocKey | AttributeMenKey)[];
}[] = [
  { label: "//_FÍS", keys: [...ATTR_BAND_KEYS.fis] },
  { label: "//_SOC", keys: [...ATTR_BAND_KEYS.soc] },
  { label: "//_MEN", keys: [...ATTR_BAND_KEYS.men] },
] as const;

export type ChargenMotor = "v5_sereno" | "classic_rev";

export interface CharacterSheet {
  name: string;
  clan: ClanId;
  /** Anomalía de linaje: prefijo táctico opcional / tachado UI. */
  antitribu: boolean;
  concept: string;
  /**
   * `CONCEPTOS_DATA.id` cuando el jugador usa plantilla CODEX (`null` = «OTRO…» texto en `concept`).
   */
  conceptPresetId: string | null;
  /** Años de no‑vida desde el Abrazo; la fusión CODEX estima Generación Mes y presupuestos derivados (no equivale automáticamente a la edad mortal). */
  yearsUnlife: number;
  /** Puntos libres (mesa Revised). El cliente no ejecuta tabla de compra; solo guarda el contador. */
  freebiePool: number;
  /** Fusión: motor Sereno V5 cliente usa el mismo reparto 7·5·3 y 13·9·5 por preset que Revised en papel. */
  chargenMotor: ChargenMotor;
  /** Índice 0–5: orden de pesos primario/secundario/terciario sobre bandas fís/soc/ment. */
  classicAttrPreset: number;
  /** Índice 0–5: orden de Talentos/Técnicas/Conocimientos contra 13/9/5. */
  classicSkillPreset: number;
  generation: Generation;
  skillMode: SkillDistributionMode;
  /** Solo Caitiff / Otro: tres disciplinas elegidas del pool. */
  caitiffDisciplinePicks: [DisciplineKey, DisciplineKey, DisciplineKey] | null;
  attributes: {
    str: number;
    dex: number;
    sta: number;
    cha: number;
    man: number;
    com: number;
    int: number;
    wit: number;
    res: number;
  };
  skills: Record<string, number>;
  disciplines: Record<string, number>;
  healthDamage: number;
  willpowerCur: number;
  willpowerMax: number;
  hunger: number;
  bloodPotency: number;
  humanity: number;
  resonance: string;
  /** Sujeto de metadatos: no es un registro de jugador (Nexo / índice). */
  isNPC?: boolean;
}

export const STORAGE_KEY = "cronista-sheet-v1";

/** Humanidad de arranque estándar en creación (ajustable con la pista ANIMA). */
export const CHARGEN_HUMANITY_BASE = 7;

/** Punto base por atributo (● gris en CODEX); el extra asignado se muestra con el color del linaje. */
export const CHARGEN_ATTRIBUTE_DOT_BASE = 1;

export const ATTRIBUTE_KEYS = [
  { key: "str" as const, label: "Fuerza", tooltip: "Capacidad de fuerza física bruta." },
  { key: "dex" as const, label: "Destreza", tooltip: "Fineza motora y reflejos bajo estrés." },
  { key: "sta" as const, label: "Resistencia", tooltip: "Aguante del cuerpo frente al daño y la fatiga." },
  { key: "cha" as const, label: "Carisma", tooltip: "Presencia que atrae o impone cuando hablas." },
  { key: "man" as const, label: "Manipulación", tooltip: "Influir en otros sin revelar la maniobra." },
  { key: "com" as const, label: "Compostura", tooltip: "Dominio emocional bajo fuego psicológico." },
  { key: "int" as const, label: "Intelecto", tooltip: "Razonamiento, memoria factual y teoría rápida." },
  { key: "wit" as const, label: "Astucia", tooltip: "Pensamiento táctico y síntesis bajo tiempo corto." },
  { key: "res" as const, label: "Resolución", tooltip: "Voluntad de seguir hasta el fondo cuando duele." },
] as const;

/** Atributos con el mínimo de hoja CODEX antes de distribuir puntos jugables extra. */
export function chargenBaseAttributes(): CharacterSheet["attributes"] {
  const b = CHARGEN_ATTRIBUTE_DOT_BASE;
  return {
    str: b,
    dex: b,
    sta: b,
    cha: b,
    man: b,
    com: b,
    int: b,
    wit: b,
    res: b,
  };
}

/** V5: tope de voluntad desde Compostura + Resolución (mínimo 1 hasta completar la distribución). */
export function willpowerMaxFromAttributes(attrs: CharacterSheet["attributes"]): number {
  return Math.max(1, attrs.com + attrs.res);
}

/** @deprecated usar SERENO_SKILL_KEYS desde @/lib/sereno para listas nuevas */
export const SKILL_KEYS = [
  "atletismo",
  "refriegas",
  "oficios",
  "conducir",
  "armas_fuego",
  "latrocinio",
  "combate_cac",
  "sigilo",
  "supervivencia",
  "trato_animales",
  "etiqueta",
  "perspicacia",
  "intimidacion",
  "liderazgo",
  "persuasion",
  "callejeo",
  "subterfugio",
  "academicos",
  "consciencia",
  "finanzas",
  "investigacion",
  "medicina",
  "ocultismo",
  "politica",
  "ciencia",
  "tecnologia",
] as const;

/** Re-export para ManifestWill / creación */
export { SERENO_SKILL_KEYS, SERENO_SKILLS } from "@/lib/sereno";

export function defaultSkills(): Record<string, number> {
  return defaultSerenoSkills();
}

export function defaultDisciplines(): Record<string, number> {
  return defaultAllDisciplines();
}

const LEGACY_DISC: Record<string, DisciplineKey> = {
  Potencia: "potence",
  Celeridad: "celerity",
  Fortaleza: "fortitude",
  Auspex: "auspex",
  Dominación: "dominate",
  Presencia: "presence",
};

export function migrateLegacyDisciplines(raw: Record<string, number>): Record<string, number> {
  const out = defaultDisciplines();
  for (const [k, v] of Object.entries(raw)) {
    const nk = LEGACY_DISC[k] ?? (k as DisciplineKey);
    if (nk in out && typeof v === "number") out[nk] = Math.max(out[nk] ?? 0, v);
  }
  return out;
}

export function emptySheet(): CharacterSheet {
  const gen: Generation = "neonato";
  const attributes = chargenBaseAttributes();
  const wpMax = willpowerMaxFromAttributes(attributes);
  return {
    name: "",
    clan: "other",
    antitribu: false,
    concept: "",
    conceptPresetId: null,
    yearsUnlife: 12,
    freebiePool: 21,
    chargenMotor: "v5_sereno",
    classicAttrPreset: 0,
    classicSkillPreset: 0,
    generation: gen,
    skillMode: "jack",
    caitiffDisciplinePicks: null,
    attributes,
    skills: defaultSkills(),
    disciplines: defaultDisciplines(),
    healthDamage: 0,
    willpowerCur: wpMax,
    willpowerMax: wpMax,
    hunger: 1,
    bloodPotency: bloodPotencyForGeneration(gen),
    humanity: CHARGEN_HUMANITY_BASE,
    resonance: "",
    isNPC: false,
  };
}

export function normalizeCharacterSheet(partial: Partial<CharacterSheet>): CharacterSheet {
  const base = emptySheet();
  const gen = partial.generation ?? base.generation;
  const clanId = partial.clan ?? base.clan;
  const mergedSkills = migrateSkillsFromLegacy(partial.skills ?? {});
  const mergedDisc = migrateLegacyDisciplines(partial.disciplines ?? {});
  return {
    ...base,
    generation: gen,
    skillMode: partial.skillMode ?? base.skillMode,
    name: partial.name ?? base.name,
    antitribu: partial.antitribu ?? base.antitribu,
    clan: clanId,
    concept: partial.concept ?? base.concept,
    conceptPresetId: ((): string | null => {
      if (partial.conceptPresetId === null) return null;
      if (
        typeof partial.conceptPresetId === "string" &&
        CONCEPTOS_DATA.some((r) => r.id === partial.conceptPresetId)
      ) {
        return partial.conceptPresetId;
      }
      return inferConceptPresetIdFromNombre((partial.concept ?? base.concept).trim());
    })(),
    yearsUnlife:
      typeof partial.yearsUnlife === "number" &&
      partial.yearsUnlife >= 0 &&
      partial.yearsUnlife <= 50000
        ? Math.floor(partial.yearsUnlife)
        : base.yearsUnlife,
    freebiePool:
      typeof partial.freebiePool === "number" && partial.freebiePool >= 0 && partial.freebiePool <= 999
        ? partial.freebiePool
        : base.freebiePool,
    chargenMotor: partial.chargenMotor ?? base.chargenMotor,
    classicAttrPreset: coerceClassicAttrPresetForClan(
      clanId,
      typeof partial.classicAttrPreset === "number" && partial.classicAttrPreset >= 0 && partial.classicAttrPreset < 6
        ? partial.classicAttrPreset
        : base.classicAttrPreset,
    ),
    classicSkillPreset:
      typeof partial.classicSkillPreset === "number" && partial.classicSkillPreset >= 0 && partial.classicSkillPreset < 6
        ? partial.classicSkillPreset
        : base.classicSkillPreset,
    caitiffDisciplinePicks:
      partial.caitiffDisciplinePicks != null
        ? partial.caitiffDisciplinePicks
        : clanId === "caitiff" || clanId === "other"
          ? clanDefaultCaitiffPicks(clanId)
          : base.caitiffDisciplinePicks,
    attributes: { ...base.attributes, ...partial.attributes },
    skills: { ...base.skills, ...mergedSkills },
    disciplines: { ...base.disciplines, ...mergedDisc },
    healthDamage: partial.healthDamage ?? base.healthDamage,
    willpowerCur: partial.willpowerCur ?? base.willpowerCur,
    willpowerMax: partial.willpowerMax ?? base.willpowerMax,
    hunger: partial.hunger ?? base.hunger,
    bloodPotency: partial.bloodPotency ?? bloodPotencyForGeneration(gen),
    humanity: partial.humanity ?? base.humanity,
    resonance: partial.resonance ?? base.resonance,
    isNPC: typeof partial.isNPC === "boolean" ? partial.isNPC : base.isNPC,
  };
}

export function loadSheet(): CharacterSheet | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<CharacterSheet>;
    return normalizeCharacterSheet(p);
  } catch {
    return null;
  }
}

export function saveSheet(sheet: CharacterSheet): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sheet));
}

export function clanDefaultCaitiffPicks(clan: ClanId): [DisciplineKey, DisciplineKey, DisciplineKey] {
  return [...CLAN_DISCIPLINE_TRIO[clan]] as [DisciplineKey, DisciplineKey, DisciplineKey];
}
