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
  { id: "other", label: "Otro / Caitiff secreto" },
];

/** Hex para acento por clan — estética gótico-tecnocrática */
export const CLAN_ACCENTS: Record<ClanId, string> = {
  ventrue: "#d4af37",
  nosferatu: "#5c7f4a",
  brujah: "#e25822",
  toreador: "#c71585",
  malkavian: "#9d4edd",
  gangrel: "#6b4423",
  tremere: "#1a237e",
  thin_blood: "#00bcd4",
  caitiff: "#8892b0",
  other: "#39ff14",
};

export interface CharacterSheet {
  name: string;
  clan: ClanId;
  concept: string;
  /** Atributos 1–5 (V5 físico / social / mental) */
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
  /** Habilidades genéricas 0–5 (subset demo) */
  skills: Record<string, number>;
  disciplines: Record<string, number>;
  /** Salud — cajas llenas de daño superficial (demo 0–7) */
  healthDamage: number;
  /** Voluntad gasta recuperable demo */
  willpowerCur: number;
  willpowerMax: number;
  hunger: number;
}

export const STORAGE_KEY = "cronista-sheet-v1";

export const SKILL_KEYS = [
  "Athletics",
  "Stealth",
  "Melee",
  "Etiquette",
  "Insight",
  "Intimidation",
  "Occult",
  "Awareness",
] as const;

export const DISCIPLINE_KEYS = [
  "Potencia",
  "Celeridad",
  "Fortaleza",
  "Auspex",
  "Dominación",
  "Presencia",
] as const;

export function defaultSkills(): Record<string, number> {
  return Object.fromEntries(SKILL_KEYS.map((k) => [k, 0]));
}

export function defaultDisciplines(): Record<string, number> {
  return Object.fromEntries(DISCIPLINE_KEYS.map((k) => [k, 0]));
}

export function emptySheet(): CharacterSheet {
  return {
    name: "",
    clan: "other",
    concept: "",
    attributes: {
      str: 1,
      dex: 1,
      sta: 1,
      cha: 1,
      man: 1,
      com: 1,
      int: 1,
      wit: 1,
      res: 1,
    },
    skills: defaultSkills(),
    disciplines: defaultDisciplines(),
    healthDamage: 0,
    willpowerCur: 3,
    willpowerMax: 3,
    hunger: 1,
  };
}

export function loadSheet(): CharacterSheet | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CharacterSheet;
  } catch {
    return null;
  }
}

export function saveSheet(sheet: CharacterSheet): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sheet));
}
