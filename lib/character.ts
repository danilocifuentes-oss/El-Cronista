import type { DisciplineKey } from "@/lib/sereno";
import {
  CLAN_DISCIPLINE_TRIO,
  defaultSerenoSkills,
  defaultAllDisciplines,
  type Generation,
  bloodPotencyForGeneration,
  migrateSkillsFromLegacy,
} from "@/lib/sereno";

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

export interface CharacterSheet {
  name: string;
  clan: ClanId;
  /** Anomalía de linaje: prefijo táctico opcional / tachado UI. */
  antitribu: boolean;
  concept: string;
  generation: Generation;
  skillMode: SkillDistributionMode;
  /** Sólo Caitiff / Otro: tres disciplinas elegidas del pool. */
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
}

export const STORAGE_KEY = "cronista-sheet-v1";

export const ATTRIBUTE_KEYS = [
  { key: "str" as const, label: "Fuerza", tooltip: "Capacidad de fuerza física bruta." },
  { key: "dex" as const, label: "Destreza", tooltip: "Fineza motora y reflejos bajo estrés." },
  { key: "sta" as const, label: "Resistencia", tooltip: "Aguante del cuerpo frente al daño y la fatiga." },
  { key: "cha" as const, label: "Carisma", tooltip: "Presencia que atrae o impone cuando hablas." },
  { key: "man" as const, label: "Manipulación", tooltip: "Dirigir a otros sin revelar tus manos." },
  { key: "com" as const, label: "Compostura", tooltip: "Dominio emocional bajo fuego psicológico." },
  { key: "int" as const, label: "Intelecto", tooltip: "Razonamiento, memoria factual y teoría rápida." },
  { key: "wit" as const, label: "Astucia", tooltip: "Pensamiento táctico y síntesis bajo tiempo corto." },
  { key: "res" as const, label: "Resolución", tooltip: "Voluntad de seguir hasta el fondo cuando duele." },
] as const;

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
  return {
    name: "",
    clan: "other",
    antitribu: false,
    concept: "",
    generation: gen,
    skillMode: "jack",
    caitiffDisciplinePicks: null,
    attributes: {
      str: 2,
      dex: 2,
      sta: 2,
      cha: 1,
      com: 3,
      man: 3,
      int: 3,
      wit: 3,
      res: 4,
    },
    skills: defaultSkills(),
    disciplines: defaultDisciplines(),
    healthDamage: 0,
    willpowerCur: 3,
    willpowerMax: 3,
    hunger: 1,
    bloodPotency: bloodPotencyForGeneration(gen),
    humanity: 7,
    resonance: "",
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
