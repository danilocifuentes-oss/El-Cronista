/**
 * Reglas de creación tipo Masquerade Revised (7/5/3 sobre base 1 en atributos;
 * 13/9/5 en habilidades base 0; permutaciones; 3 puntos entre las 3 disciplinas de línea).
 * Complementa el validador V5 en `sereno.ts` — no lo sustituye.
 */

import { ATTR_BAND_KEYS, ATTRIBUTE_KEYS, type CharacterSheet, type ClanId } from "./character";
import {
  SERENO_SKILL_KEYS,
  SERENO_SKILLS,
  getActiveDisciplineKeys,
  type DisciplineKey,
  type SkillLane,
} from "./sereno";

export interface PointsSchema {
  primary: number;
  secondary: number;
  tertiary: number;
}

export const ATRIBUTOS_SCHEMA: PointsSchema = { primary: 7, secondary: 5, tertiary: 3 };
export const HABILIDADES_SCHEMA: PointsSchema = { primary: 13, secondary: 9, tertiary: 5 };

export type TierRank = keyof PointsSchema;

const TIER_PERMS: readonly (readonly TierRank[])[] = [
  ["primary", "secondary", "tertiary"],
  ["primary", "tertiary", "secondary"],
  ["secondary", "primary", "tertiary"],
  ["secondary", "tertiary", "primary"],
  ["tertiary", "primary", "secondary"],
  ["tertiary", "secondary", "primary"],
];

function permuteMap<T extends string>(bands: readonly T[]): Record<T, TierRank>[] {
  return TIER_PERMS.map((order) => {
    const m = {} as Record<T, TierRank>;
    bands.forEach((b, i) => {
      m[b] = order[i] as TierRank;
    });
    return m;
  });
}

export type ClassicAttrPermMap = Record<"fis" | "soc" | "men", TierRank>;
export type ClassicSkillPermMap = Record<"talento" | "tecnica" | "conocimiento", TierRank>;

export const CLASSIC_ATTR_PERM_PRESETS: ClassicAttrPermMap[] = permuteMap([
  "fis",
  "soc",
  "men",
] as const);

export const CLASSIC_SKILL_PERM_PRESETS: ClassicSkillPermMap[] = permuteMap([
  "talento",
  "tecnica",
  "conocimiento",
] as const);

/** P = primario (+7/+13), S = secundario (+5/+9), T = terciario (+3/+5). */
const PS_T: Record<TierRank, string> = { primary: "P", secondary: "S", tertiary: "T" };

export function classicAttrPresetCaption(idx: number): string {
  const p = CLASSIC_ATTR_PERM_PRESETS[idx % 6];
  const order: (keyof ClassicAttrPermMap)[] = ["fis", "soc", "men"];
  return order.map((b) => `${b.toUpperCase()}→${PS_T[p[b]]}`).join(" · ");
}

export function classicSkillPresetCaption(idx: number): string {
  const p = CLASSIC_SKILL_PERM_PRESETS[idx % 6];
  const order: SkillLane[] = ["talento", "tecnica", "conocimiento"];
  const short: Record<SkillLane, string> = {
    talento: "TAL",
    tecnica: "TÉC",
    conocimiento: "CON",
  };
  return order.map((lane) => `${short[lane]}→${PS_T[p[lane]]}`).join(" · ");
}

/** Excedente sobre base (atributos clásicos: base 1). */
export function sumAttributeExcess(
  attrs: CharacterSheet["attributes"],
  keys: readonly string[],
  baseline = 1,
): number {
  let s = 0;
  for (const k of keys) {
    const v = attrs[k as keyof CharacterSheet["attributes"]];
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    s += Math.max(0, Math.floor(v) - baseline);
  }
  return s;
}

/** Suma niveles en habilidades (base 0). */
export function sumSkillRaw(skills: Record<string, number>, keys: readonly string[]): number {
  return keys.reduce((acc, k) => acc + (skills[k] ?? 0), 0);
}

export function keysForSkillLane(lane: SkillLane): string[] {
  return SERENO_SKILLS.filter((s) => s.lane === lane).map((s) => s.key);
}

export function validatePointsDistribution(
  values: Record<string, number>,
  schema: PointsSchema,
  groups: { primary: string[]; secondary: string[]; tertiary: string[] },
  opts?: { attributeExcess?: boolean; baseline?: number },
): { valid: boolean; sums: PointsSchema } {
  const attrExcess = !!opts?.attributeExcess;
  const baseline = opts?.baseline ?? (attrExcess ? 1 : 0);
  const sumGroup = (group: string[]) =>
    attrExcess
      ? sumAttributeExcess(values as CharacterSheet["attributes"], group, baseline)
      : group.reduce((sum, key) => sum + (values[key] ?? 0), 0);

  const primarySum = sumGroup(groups.primary);
  const secondarySum = sumGroup(groups.secondary);
  const tertiarySum = sumGroup(groups.tertiary);

  return {
    valid:
      primarySum === schema.primary &&
      secondarySum === schema.secondary &&
      tertiarySum === schema.tertiary,
    sums: { primary: primarySum, secondary: secondarySum, tertiary: tertiarySum },
  };
}

/** Agrupa las tres bandas fís/soc/ment por columna monetaria primario/secundario/terciario. */
export function expandAttrGroups(
  attrPermIdx: number,
): { primary: string[]; secondary: string[]; tertiary: string[] } {
  const idx = attrPermIdx % CLASSIC_ATTR_PERM_PRESETS.length;
  const perm = CLASSIC_ATTR_PERM_PRESETS[idx] ?? CLASSIC_ATTR_PERM_PRESETS[0];
  const byTier: Record<TierRank, string[]> = { primary: [], secondary: [], tertiary: [] };
  (Object.keys(ATTR_BAND_KEYS) as (keyof typeof ATTR_BAND_KEYS)[]).forEach((band) => {
    const tier = perm[band];
    const keys = ATTR_BAND_KEYS[band];
    byTier[tier].push(...keys);
  });
  return { primary: byTier.primary, secondary: byTier.secondary, tertiary: byTier.tertiary };
}

export function expandSkillGroups(
  skillPermIdx: number,
): { primary: string[]; secondary: string[]; tertiary: string[] } {
  const idx = skillPermIdx % CLASSIC_SKILL_PERM_PRESETS.length;
  const perm = CLASSIC_SKILL_PERM_PRESETS[idx] ?? CLASSIC_SKILL_PERM_PRESETS[0];
  const byTier: Record<TierRank, string[]> = { primary: [], secondary: [], tertiary: [] };
  (["talento", "tecnica", "conocimiento"] as const).forEach((lane) => {
    const tier = perm[lane];
    byTier[tier].push(...keysForSkillLane(lane));
  });
  return {
    primary: byTier.primary,
    secondary: byTier.secondary,
    tertiary: byTier.tertiary,
  };
}

/** null = válido */
export function validateClassicAttributeSpread(
  attrs: CharacterSheet["attributes"],
  presetIdx: number,
): string | null {
  for (const { key } of ATTRIBUTE_KEYS) {
    const v = attrs[key];
    if (typeof v !== "number" || v < 1 || v > 5) return "!";
  }
  const groups = expandAttrGroups(presetIdx);
  const res = validatePointsDistribution(
    attrs as unknown as Record<string, number>,
    ATRIBUTOS_SCHEMA,
    groups,
    { attributeExcess: true, baseline: 1 },
  );
  return res.valid ? null : "!";
}

export function validateClassicSkillSpread(skills: Record<string, number>, presetIdx: number): string | null {
  for (const k of SERENO_SKILL_KEYS) {
    const v = skills[k] ?? 0;
    if (v < 0 || v > 5) return "!";
  }
  const groups = expandSkillGroups(presetIdx);
  const res = validatePointsDistribution(skills, HABILIDADES_SCHEMA, groups);
  return res.valid ? null : "!";
}

/** Revised + fusión Mes: total `budget` entre las tres disciplinas activas (`maxPer` por disciplina). */
export function validateClassicDisciplineSpread(
  disciplines: Record<string, number>,
  clan: ClanId,
  picks: [DisciplineKey, DisciplineKey, DisciplineKey] | null,
  fusion?: { budget: number; maxPer: number },
): string | null {
  const keys = getActiveDisciplineKeys(clan, picks);
  const budget = fusion?.budget ?? 3;
  const maxPer = fusion?.maxPer ?? 5;
  for (const dk of Object.keys(disciplines)) {
    if (!keys.includes(dk as DisciplineKey) && (disciplines[dk] ?? 0) > 0) return "!";
  }
  let sum = 0;
  for (const k of keys) {
    const v = disciplines[k] ?? 0;
    if (v < 0 || v > maxPer) return "!";
    sum += v;
  }
  if (sum !== budget) return "!";
  return null;
}

/** Algunos clanes CODEX fuerzan cuál grupo (fís/social/mental) recibe siempre los 7 puntos sobre base 1. */
const CLAN_LOCKED_ATTR_PRIMARY: Partial<Record<ClanId, keyof typeof ATTR_BAND_KEYS>> = {
  brujah: "fis",
  nosferatu: "fis",
  gangrel: "fis",
  ventrue: "soc",
  toreador: "soc",
  malkavian: "men",
  tremere: "men",
};

export function clanLockedAttrPrimaryBand(clan: ClanId): keyof typeof ATTR_BAND_KEYS | null {
  return CLAN_LOCKED_ATTR_PRIMARY[clan] ?? null;
}

/** Etiqueta corta («físicos» …) cuando el clan fija grupo principal en CODEX. */
export function classicAttrPresetChoicesForClan(clan: ClanId): number[] {
  const b = clanLockedAttrPrimaryBand(clan);
  if (b === null) return [0, 1, 2, 3, 4, 5];
  const out: number[] = [];
  CLASSIC_ATTR_PERM_PRESETS.forEach((p, i) => {
    if (p[b] === "primary") out.push(i);
  });
  return out.length > 0 ? out : [0];
}

/** Asegura preset permitido cuando el clan fija grupo principal. */
export function coerceClassicAttrPresetForClan(clan: ClanId, presetIdx: number): number {
  const choices = classicAttrPresetChoicesForClan(clan);
  const p = presetIdx >= 0 && presetIdx <= 5 ? presetIdx % 6 : 0;
  return choices.includes(p) ? p : choices[0] ?? 0;
}

const ATTR_BAND_SUMMARY_ES: Record<keyof ClassicAttrPermMap, string> = {
  fis: "físicos",
  soc: "sociales",
  men: "mentales",
};

export function clanLockedAttrPrimaryEs(clan: ClanId): string | null {
  const b = clanLockedAttrPrimaryBand(clan);
  if (!b) return null;
  return ATTR_BAND_SUMMARY_ES[b];
}

export function classicAttrPresetSummary(idx: number): string {
  const perm = CLASSIC_ATTR_PERM_PRESETS[idx % CLASSIC_ATTR_PERM_PRESETS.length];
  return (["fis", "soc", "men"] as const)
    .map((b) => `${ATRIBUTOS_SCHEMA[perm[b]]} en ${ATTR_BAND_SUMMARY_ES[b]}`)
    .join(" · ");
}

const SKILL_LANE_SUMMARY_ES: Record<SkillLane, string> = {
  talento: "talentos",
  tecnica: "técnicas",
  conocimiento: "conocimientos",
};

export function classicSkillPresetSummary(idx: number): string {
  const perm = CLASSIC_SKILL_PERM_PRESETS[idx % CLASSIC_SKILL_PERM_PRESETS.length];
  return (["talento", "tecnica", "conocimiento"] as const)
    .map((lane) => `${HABILIDADES_SCHEMA[perm[lane]]} en ${SKILL_LANE_SUMMARY_ES[lane]}`)
    .join(" · ");
}

export function summarizeClassicTotals(
  sheet: CharacterSheet,
): { attrs: PointsSchema; skills: PointsSchema } {
  const ag = expandAttrGroups(sheet.classicAttrPreset);
  const sg = expandSkillGroups(sheet.classicSkillPreset);
  const attrs = validatePointsDistribution(
    sheet.attributes as unknown as Record<string, number>,
    ATRIBUTOS_SCHEMA,
    ag,
    { attributeExcess: true, baseline: 1 },
  ).sums;
  const skills = validatePointsDistribution(sheet.skills, HABILIDADES_SCHEMA, sg).sums;
  return { attrs, skills };
}
