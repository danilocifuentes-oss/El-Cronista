/**
 * Límites estrictos al pulsar ● en CODEX: evita estado imposible por exceso
 * antes del sellado (no sustituye la validación final al sellar).
 */

import { ATTRIBUTE_KEYS, type CharacterSheet } from "./character";
import { fusionChargenProfile } from "./fusionTimeline";
import {
  ATRIBUTOS_SCHEMA,
  expandAttrGroups,
  expandSkillGroups,
  HABILIDADES_SCHEMA,
  sumAttributeExcess,
  sumSkillRaw,
} from "./serenoClassic";
import {
  getActiveDisciplineKeys,
  SERENO_SKILL_KEYS,
  type DisciplineKey,
  type SkillMode,
} from "./sereno";

/** Suma puntos distribuidos en V5 CODEX cerrado Sereno (1×4 · 4×3 · 3×2 · 1×1). */
export const CODEX_V5_ATTRIBUTE_POOL = 23;
const V5_ATTR_DOT_TOTAL = CODEX_V5_ATTRIBUTE_POOL;

const V5_SKILL_CAP_JACK = { 3: 1, 2: 8, 1: 10 } as const;
const V5_SKILL_CAP_SPEC = { 3: 3, 2: 5, 1: 7 } as const;

function sumAttrDots(attrs: CharacterSheet["attributes"]): number {
  let s = 0;
  for (const { key } of ATTRIBUTE_KEYS) {
    s += attrs[key];
  }
  return s;
}

function countSkillRankHistogram(vals: readonly number[]): Record<number, number> {
  const m: Record<number, number> = {};
  for (const n of vals) {
    m[n] = (m[n] ?? 0) + 1;
  }
  return m;
}

function v5SkillsPartialOk(vals: readonly number[], mode: SkillMode): boolean {
  if (vals.some((v) => v < 0 || v > 3)) return false;
  const c = countSkillRankHistogram(vals);
  if (mode === "jack") {
    return (c[3] ?? 0) <= 1 && (c[2] ?? 0) <= 8 && (c[1] ?? 0) <= 10;
  }
  return (c[3] ?? 0) <= 3 && (c[2] ?? 0) <= 5 && (c[1] ?? 0) <= 7;
}

function classicAttrCapsOk(attrs: CharacterSheet["attributes"], presetIdx: number): boolean {
  for (const { key } of ATTRIBUTE_KEYS) {
    const v = attrs[key];
    if (typeof v !== "number" || v < 1 || v > 5) return false;
  }
  const groups = expandAttrGroups(presetIdx);
  return (
    sumAttributeExcess(attrs, groups.primary, 1) <= ATRIBUTOS_SCHEMA.primary &&
    sumAttributeExcess(attrs, groups.secondary, 1) <= ATRIBUTOS_SCHEMA.secondary &&
    sumAttributeExcess(attrs, groups.tertiary, 1) <= ATRIBUTOS_SCHEMA.tertiary
  );
}

function classicSkillCapsOk(skills: Record<string, number>, presetIdx: number): boolean {
  for (const k of SERENO_SKILL_KEYS) {
    const v = skills[k] ?? 0;
    if (v < 0 || v > 5) return false;
  }
  const groups = expandSkillGroups(presetIdx);
  return (
    sumSkillRaw(skills, groups.primary) <= HABILIDADES_SCHEMA.primary &&
    sumSkillRaw(skills, groups.secondary) <= HABILIDADES_SCHEMA.secondary &&
    sumSkillRaw(skills, groups.tertiary) <= HABILIDADES_SCHEMA.tertiary
  );
}

export function codexAllowsAttributeDots(
  sheet: CharacterSheet,
  key: keyof CharacterSheet["attributes"],
  proposed: number,
): boolean {
  const cur = sheet.attributes[key];
  const minV = 1;
  const maxV = sheet.chargenMotor === "classic_rev" ? 5 : 4;

  if (!Number.isFinite(proposed) || Math.floor(proposed) !== proposed) return false;
  const p = proposed as number;

  if (p === cur) return true;

  const nextAttrs = { ...sheet.attributes, [key]: p };
  if (p < minV || p > maxV) return false;

  /** Bajar siempre dentro de rangos físicos liberando presupuesto. */
  if (p < cur) return true;

  if (sheet.chargenMotor === "classic_rev") {
    return classicAttrCapsOk(nextAttrs, sheet.classicAttrPreset);
  }

  /** V5: tope por sumatorio (23 puntos repartidos) + techo/dot. */
  return sumAttrDots(nextAttrs) <= V5_ATTR_DOT_TOTAL;
}

export function codexAllowsSkillDots(sheet: CharacterSheet, skillKey: string, proposed: number): boolean {
  if (!(SERENO_SKILL_KEYS as readonly string[]).includes(skillKey)) return false;

  const cur = sheet.skills[skillKey] ?? 0;
  const maxV = sheet.chargenMotor === "classic_rev" ? 5 : 3;

  if (!Number.isFinite(proposed) || Math.floor(proposed) !== proposed) return false;
  const p = proposed as number;
  if (p < 0 || p > maxV) return false;
  if (p === cur) return true;

  const nextSkills = { ...sheet.skills, [skillKey]: p };
  if (p < cur) return true;

  if (sheet.chargenMotor === "classic_rev") {
    return classicSkillCapsOk(nextSkills, sheet.classicSkillPreset);
  }

  const vals = SERENO_SKILL_KEYS.map((k) => nextSkills[k] ?? 0);
  return v5SkillsPartialOk(vals, sheet.skillMode);
}

export function codexAllowsDisciplineDots(sheet: CharacterSheet, discKey: DisciplineKey, proposed: number): boolean {
  const tl = fusionChargenProfile({
    clan: sheet.clan,
    yearsUnlife: sheet.yearsUnlife,
    generation: sheet.generation,
  });

  const active = getActiveDisciplineKeys(sheet.clan, sheet.caitiffDisciplinePicks);
  if (!active.includes(discKey)) return proposed === 0;

  const cur = (sheet.disciplines[discKey] ?? 0) as number;
  const classic = sheet.chargenMotor === "classic_rev";
  const budget = classic ? tl.classicDisciplineBudget : tl.v5DisciplineBudget;
  const maxPer = classic ? tl.classicMaxPerDot : tl.v5MaxPerDot;

  if (!Number.isFinite(proposed) || Math.floor(proposed) !== proposed) return false;
  const p = proposed as number;
  if (p < 0 || p > maxPer) return false;
  if (p === cur) return true;

  const nextDisc = { ...sheet.disciplines, [discKey]: p };

  /** Construcción: Σ línea clan ≤ presupuesto; al sellar debe coincidir exactamente. */
  const sumActive = active.reduce((acc, k) => acc + ((nextDisc[k] as number | undefined) ?? 0), 0);
  return sumActive <= budget;
}

export function codexV5AttributeDotsUsed(attrs: CharacterSheet["attributes"]): number {
  return sumAttrDots(attrs);
}

export function codexV5SkillRankSnapshot(sheet: CharacterSheet): {
  r3: number;
  r2: number;
  r1: number;
  cap3: number;
  cap2: number;
  cap1: number;
} {
  const caps = sheet.skillMode === "jack" ? V5_SKILL_CAP_JACK : V5_SKILL_CAP_SPEC;
  const vals = SERENO_SKILL_KEYS.map((k) => sheet.skills[k] ?? 0);
  const c = countSkillRankHistogram(vals);
  return {
    r3: c[3] ?? 0,
    r2: c[2] ?? 0,
    r1: c[1] ?? 0,
    cap3: caps[3],
    cap2: caps[2],
    cap1: caps[1],
  };
}

/** Mayor valor admitido para ese atributo dado el resto del sheet (sin pisar otros stats). */
export function codexMaxAttributeDots(sheet: CharacterSheet, key: keyof CharacterSheet["attributes"]): number {
  const minV = 1;
  const maxV = sheet.chargenMotor === "classic_rev" ? 5 : 4;
  for (let trial = maxV; trial >= minV; trial--) {
    if (codexAllowsAttributeDots(sheet, key, trial)) return trial;
  }
  return minV;
}

export function codexMaxSkillDots(sheet: CharacterSheet, skillKey: string): number {
  const maxV = sheet.chargenMotor === "classic_rev" ? 5 : 3;
  for (let trial = maxV; trial >= 0; trial--) {
    if (codexAllowsSkillDots(sheet, skillKey, trial)) return trial;
  }
  return 0;
}

export function codexMaxDisciplineDots(sheet: CharacterSheet, discKey: DisciplineKey): number {
  const tl = fusionChargenProfile({
    clan: sheet.clan,
    yearsUnlife: sheet.yearsUnlife,
    generation: sheet.generation,
  });
  const classic = sheet.chargenMotor === "classic_rev";
  const maxPer = classic ? tl.classicMaxPerDot : tl.v5MaxPerDot;
  for (let trial = maxPer; trial >= 0; trial--) {
    if (codexAllowsDisciplineDots(sheet, discKey, trial)) return trial;
  }
  return 0;
}

export function codexRejectHintAttribute(
  sheet: CharacterSheet,
  key: keyof CharacterSheet["attributes"],
  proposed: number,
): string {
  if (codexAllowsAttributeDots(sheet, key, proposed)) return "";
  const cur = sheet.attributes[key];
  if (proposed < cur) return "";
  const minV = 1;
  const maxV = sheet.chargenMotor === "classic_rev" ? 5 : 4;
  if (proposed < minV || proposed > maxV) return "";

  const nextAttrs = { ...sheet.attributes, [key]: proposed };
  if (sheet.chargenMotor === "classic_rev") {
    return classicAttrCapsOk(nextAttrs, sheet.classicAttrPreset)
      ? ""
      : "Cupo Revised: el exceso P/S/T con tu preset actual no permite subir ese atributo. Bajá otro stat de la misma banda.";
  }

  if (sumAttrDots(nextAttrs) > V5_ATTR_DOT_TOTAL) {
    return `Pool Sereno (${V5_ATTR_DOT_TOTAL} puntos entre atributos): no queda margen sin bajar otro stat.`;
  }
  return "No podés usar ese valor en atributos con la matriz actual.";
}

export function codexRejectHintSkill(sheet: CharacterSheet, skillKey: string, proposed: number): string {
  if (codexAllowsSkillDots(sheet, skillKey, proposed)) return "";
  const cur = sheet.skills[skillKey] ?? 0;
  if (proposed < cur) return "";

  const nextSkills = { ...sheet.skills, [skillKey]: proposed };

  if (sheet.chargenMotor === "classic_rev") {
    return classicSkillCapsOk(nextSkills, sheet.classicSkillPreset)
      ? ""
      : "Cupo Revised 13·9·5: ese reparto ya llena tu carril (P/S/T) del preset.";
  }

  const vals = SERENO_SKILL_KEYS.map((k) => nextSkills[k] ?? 0);
  const mode = sheet.skillMode;
  if (vals.some((v) => v < 0 || v > 3)) return "";
  const c = countSkillRankHistogram(vals);
  const caps = mode === "jack" ? V5_SKILL_CAP_JACK : V5_SKILL_CAP_SPEC;
  if ((c[3] ?? 0) > caps[3]) {
    return mode === "jack"
      ? "Patrón JACK: sólo una habilidad puede estar en rango ●●●."
      : "Patrón ESPEC: sólo hasta tres habilidades en ●●●.";
  }
  if ((c[2] ?? 0) > caps[2]) {
    return mode === "jack"
      ? "Patrón JACK: llegaste al cupo máximo en rango ●●."
      : "Patrón ESPEC: llegaste al cupo máximo en ●●.";
  }
  if ((c[1] ?? 0) > caps[1]) {
    return mode === "jack"
      ? "Patrón JACK: llegaste al máximo en habilidades a ●."
      : "Patrón ESPEC: llegaste al máximo en habilidades a ●.";
  }
  return "No podés subir esa habilidad con el modo actual.";
}

export function codexRejectHintDiscipline(sheet: CharacterSheet, discKey: DisciplineKey, proposed: number): string {
  if (codexAllowsDisciplineDots(sheet, discKey, proposed)) return "";
  const cur = (sheet.disciplines[discKey] ?? 0) as number;
  if (proposed < cur) return "";

  const tl = fusionChargenProfile({
    clan: sheet.clan,
    yearsUnlife: sheet.yearsUnlife,
    generation: sheet.generation,
  });
  const classic = sheet.chargenMotor === "classic_rev";
  const budget = classic ? tl.classicDisciplineBudget : tl.v5DisciplineBudget;
  const maxPer = classic ? tl.classicMaxPerDot : tl.v5MaxPerDot;

  if (proposed > maxPer) {
    return `Como máximo ${maxPer} puntos por disciplina al crear (${classic ? "Revised" : "Sereno V5"}).`;
  }

  const active = getActiveDisciplineKeys(sheet.clan, sheet.caitiffDisciplinePicks);
  const nextDisc = { ...sheet.disciplines, [discKey]: proposed };
  const sumActive = active.reduce((acc, k) => acc + ((nextDisc[k] as number | undefined) ?? 0), 0);

  if (sumActive > budget) {
    return `Presupuesto de clan: tus tres disciplinas suman hasta ${budget} puntos ahora mismo. Bajá otra antes de seguir aquí.`;
  }
  return "No podés aumentar ese poder con la matriz vigente.";
}
