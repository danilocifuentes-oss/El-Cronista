/**
 * Límites incrementales en CODEX: reparto atributos 7·5·3 (exceso sobre base 1)
 * y habilidades 13·9·5 según presets (también en modo Sereno V5 cliente).
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
} from "./sereno";

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

const ATTR_DOT_MAX = 5;
const SKILL_DOT_MAX = 5;

export function codexAllowsAttributeDots(
  sheet: CharacterSheet,
  key: keyof CharacterSheet["attributes"],
  proposed: number,
): boolean {
  const cur = sheet.attributes[key];
  const minV = 1;

  if (!Number.isFinite(proposed) || Math.floor(proposed) !== proposed) return false;
  const p = proposed as number;

  if (p === cur) return true;

  const nextAttrs = { ...sheet.attributes, [key]: p };
  if (p < minV || p > ATTR_DOT_MAX) return false;

  if (p < cur) return true;

  return classicAttrCapsOk(nextAttrs, sheet.classicAttrPreset);
}

export function codexAllowsSkillDots(sheet: CharacterSheet, skillKey: string, proposed: number): boolean {
  if (!(SERENO_SKILL_KEYS as readonly string[]).includes(skillKey)) return false;

  const cur = sheet.skills[skillKey] ?? 0;

  if (!Number.isFinite(proposed) || Math.floor(proposed) !== proposed) return false;
  const p = proposed as number;
  if (p < 0 || p > SKILL_DOT_MAX) return false;
  if (p === cur) return true;

  const nextSkills = { ...sheet.skills, [skillKey]: p };
  if (p < cur) return true;

  return classicSkillCapsOk(nextSkills, sheet.classicSkillPreset);
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

  const sumActive = active.reduce((acc, k) => acc + ((nextDisc[k] as number | undefined) ?? 0), 0);
  return sumActive <= budget;
}

/** Mayor valor admitido para ese atributo dado el estado actual del reparto 7·5·3. */
export function codexMaxAttributeDots(sheet: CharacterSheet, key: keyof CharacterSheet["attributes"]): number {
  const minV = 1;
  for (let trial = ATTR_DOT_MAX; trial >= minV; trial--) {
    if (codexAllowsAttributeDots(sheet, key, trial)) return trial;
  }
  return minV;
}

export function codexMaxSkillDots(sheet: CharacterSheet, skillKey: string): number {
  for (let trial = SKILL_DOT_MAX; trial >= 0; trial--) {
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
  if (proposed < 1 || proposed > ATTR_DOT_MAX) return "";

  const nextAttrs = { ...sheet.attributes, [key]: proposed };
  return classicAttrCapsOk(nextAttrs, sheet.classicAttrPreset)
    ? ""
    : "Ese aumento sobrepasa el cupo del grupo físico · social · mental elegido arriba (7 · 5 · 3 sobre cada punto base).";
}

export function codexRejectHintSkill(sheet: CharacterSheet, skillKey: string, proposed: number): string {
  if (codexAllowsSkillDots(sheet, skillKey, proposed)) return "";
  const cur = sheet.skills[skillKey] ?? 0;
  if (proposed < cur) return "";
  if (proposed < 0 || proposed > SKILL_DOT_MAX) return "";

  const nextSkills = { ...sheet.skills, [skillKey]: proposed };
  return classicSkillCapsOk(nextSkills, sheet.classicSkillPreset)
    ? ""
    : "No quedan puntos en ese bloque (talentos · técnicas · conocimiento; 13 · 9 · 5 según el preset). Hay que reducir puntos dentro del mismo grupo.";
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
    return `Presupuesto de clan: el total de las tres disciplinas no puede superar ${budget} puntos. Hay que reducir otra disciplina antes de continuar.`;
  }
  return "No se puede aumentar ese poder con la matriz vigente.";
}
