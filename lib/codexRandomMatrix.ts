/**
 * Reparto aleatorio válido para CODEX (7·5·3 atributos, 13·9·5 habilidades, disciplinas al presupuesto).
 */

import {
  CHARGEN_ATTRIBUTE_DOT_BASE,
  chargenBaseAttributes,
  defaultDisciplines,
  type CharacterSheet,
  type ClanId,
} from "@/lib/character";
import {
  SERENO_SKILL_KEYS,
  getActiveDisciplineKeys,
  type DisciplineKey,
} from "@/lib/sereno";
import type { FusionChargenProfile } from "@/lib/fusionTimeline";
import {
  ATRIBUTOS_SCHEMA,
  classicAttrPresetChoicesForClan,
  expandAttrGroups,
  expandSkillGroups,
  HABILIDADES_SCHEMA,
} from "@/lib/serenoClassic";

/** Reparte `total` unidades en `slotCount` casillas, cada una ≤ maxPerSlot (algoritmo por sorteos válidos). */
export function randomAllocateUnits(total: number, slotCount: number, maxPerSlot: number): number[] {
  const capSum = slotCount * maxPerSlot;
  if (total < 0 || total > capSum) throw new Error("randomAllocateUnits: total fuera de rango");
  if (slotCount <= 0) return [];
  const a = Array.from({ length: slotCount }, () => 0);
  for (let t = 0; t < total; t++) {
    const cand: number[] = [];
    for (let i = 0; i < slotCount; i++) {
      if (a[i] < maxPerSlot) cand.push(i);
    }
    if (cand.length === 0) return randomAllocateUnits(total, slotCount, maxPerSlot);
    const pick = cand[Math.floor(Math.random() * cand.length)]!;
    a[pick]++;
  }
  return a;
}

/** Tres valores no negativos que suman budget, cada uno ≤ maxPer. */
export function randomDisciplineTriple(budget: number, maxPer: number): [number, number, number] {
  if (budget < 0) return [0, 0, 0];
  const d0Hi = Math.min(maxPer, budget);
  const d0Lo = Math.max(0, budget - maxPer * 2);
  const d0 = d0Lo + Math.floor(Math.random() * (d0Hi - d0Lo + 1));
  const rem = budget - d0;
  const d1Hi = Math.min(maxPer, rem);
  const d1Lo = Math.max(0, rem - maxPer);
  const d1 = d1Lo + Math.floor(Math.random() * (d1Hi - d1Lo + 1));
  const d2 = rem - d1;
  return [d0, d1, d2];
}

export function buildRandomAttributesForPreset(attrPresetIdx: number): CharacterSheet["attributes"] {
  const attrs = { ...chargenBaseAttributes() };
  const groups = expandAttrGroups(attrPresetIdx);

  (
    ["primary", "secondary", "tertiary"] as const
  ).forEach((tier) => {
    const keys = groups[tier] as (keyof CharacterSheet["attributes"])[];
    const total = ATRIBUTOS_SCHEMA[tier];
    const xs = randomAllocateUnits(total, keys.length, 4);
    keys.forEach((k, i) => {
      attrs[k] = CHARGEN_ATTRIBUTE_DOT_BASE + xs[i];
    });
  });

  return attrs;
}

export function buildRandomSkillsForPreset(skillPresetIdx: number): Record<string, number> {
  const out: Record<string, number> = Object.fromEntries(SERENO_SKILL_KEYS.map((k) => [k, 0]));
  const groups = expandSkillGroups(skillPresetIdx);

  (["primary", "secondary", "tertiary"] as const).forEach((tier) => {
    const keys = groups[tier];
    const total = HABILIDADES_SCHEMA[tier];
    const xs = randomAllocateUnits(total, keys.length, 5);
    keys.forEach((k, i) => {
      out[k] = xs[i];
    });
  });

  return out;
}

export interface RandomMatrixParams {
  clan: ClanId;
  chargenMotor: CharacterSheet["chargenMotor"];
  generation: CharacterSheet["generation"];
  yearsUnlife: number;
  caitiffDisciplinePicks: CharacterSheet["caitiffDisciplinePicks"];
  timeline: FusionChargenProfile;
}

export interface RandomMatrixResult {
  attributes: CharacterSheet["attributes"];
  skills: Record<string, number>;
  disciplines: CharacterSheet["disciplines"];
  classicAttrPreset: number;
  classicSkillPreset: number;
}

/** Genera atributos, habilidades, disciplinas y presets aleatorios respetando reglas y opciones de clan. */
export function generateRandomCodexMatrix(p: RandomMatrixParams): RandomMatrixResult {
  const choices = classicAttrPresetChoicesForClan(p.clan);
  const classicAttrPreset = choices[Math.floor(Math.random() * choices.length)] ?? 0;
  const classicSkillPreset = Math.floor(Math.random() * 6);

  const attributes = buildRandomAttributesForPreset(classicAttrPreset);
  const skills = buildRandomSkillsForPreset(classicSkillPreset);

  const active = getActiveDisciplineKeys(p.clan, p.caitiffDisciplinePicks);
  const classic = p.chargenMotor === "classic_rev";
  const budget = classic ? p.timeline.classicDisciplineBudget : p.timeline.v5DisciplineBudget;
  const maxPer = classic ? p.timeline.classicMaxPerDot : p.timeline.v5MaxPerDot;
  const [d0, d1, d2] = randomDisciplineTriple(budget, maxPer);

  const discs = defaultDisciplines() as CharacterSheet["disciplines"];
  active.forEach((k, idx) => {
    const val = idx === 0 ? d0 : idx === 1 ? d1 : d2;
    discs[k as DisciplineKey] = val;
  });

  return {
    attributes,
    skills,
    disciplines: discs,
    classicAttrPreset,
    classicSkillPreset,
  };
}
