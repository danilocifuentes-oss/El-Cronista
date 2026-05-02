/**
 * Línea temporal CODEX · fusión “a todo gas”: años sin vida → generación Masquerada
 * tentativa + presupuestos derivados (freebies · disciplinas V5/Revised).
 * No es tabla canónica de White Wolf: el director de juego debe confirmar sire y generación real.
 */

import type { ClanId } from "./character";
import type { Generation } from "./sereno";
import { disciplineBudget } from "./sereno";

/** Generación vampírica típica 8–13 (8 = linaje ancestral raro fuera del elíseo). */
export type MasqueradeGenNumber = 8 | 9 | 10 | 11 | 12 | 13;

/** Años desde el Abrazo → género número (fronteras ajustables mesa CODEX). */
export function masqueradeGenerationFromYears(yearsUnlife: number): MasqueradeGenNumber {
  if (!Number.isFinite(yearsUnlife) || yearsUnlife < 0) return 13;
  const y = Math.floor(yearsUnlife);
  if (y < 35) return 13;
  if (y < 85) return 12;
  if (y < 170) return 11;
  if (y < 320) return 10;
  if (y < 540) return 9;
  return 8;
}

/** Cohort Sereno neonato vs ancilla a partir del tiempo desde el Beso (heurística CODEX). */
export function suggestedSerenoGeneration(yearsUnlife: number): Generation {
  const y = Math.max(0, Math.floor(Number.isFinite(yearsUnlife) ? yearsUnlife : 0));
  return y >= 90 ? "ancilla" : "neonato";
}

/** Punto medio clásico 21 revisado con bonus por sangre menos diluida. */
export function fusionFreebiesSuggested(masqGen: MasqueradeGenNumber): number {
  return 21 + 2 * Math.max(0, 13 - masqGen);
}

/** Máximo razonable por disciplina cuando el sumatorio sube por generación. */
export function fusionMaxDotsPerDiscipline(budget: number): number {
  if (budget <= 4) return 2;
  if (budget <= 7) return 3;
  return 5;
}

/** Presupuesto V5 Sereno cliente: neonato 2 · ancilla 3 + bleed generacional cap 8. */
export function fusionV5DisciplineBudget(category: Generation, masqGen: MasqueradeGenNumber): number {
  const base = disciplineBudget(category);
  const bleed = Math.max(0, 13 - masqGen);
  return Math.min(base + bleed, 8);
}

/** Presupuesto Revised dentro del CODEX: 3 puntos línea típico neonato · sube si la sangre es más antigua del mapa Mes. */
export function fusionClassicDisciplineBudget(masqGen: MasqueradeGenNumber): number {
  return Math.min(3 + Math.max(0, 13 - masqGen), 10);
}

export interface FusionChargenProfile {
  masqueradeGeneration: MasqueradeGenNumber;
  suggestedSerenoGeneration: Generation;
  freebiesSuggested: number;
  v5DisciplineBudget: number;
  v5MaxPerDot: number;
  classicDisciplineBudget: number;
  classicMaxPerDot: number;
  /** Thin-blood: sin bleed de Mes (respetar reglas especiales fuera del mapa estándar). */
  thinBloodNoBonus: boolean;
}

export function fusionChargenProfile(sheet: {
  clan: ClanId;
  yearsUnlife: number;
  generation: Generation;
}): FusionChargenProfile {
  const thin = sheet.clan === "thin_blood";
  const masq = thin ? (13 as MasqueradeGenNumber) : masqueradeGenerationFromYears(sheet.yearsUnlife);
  const suggestedCategory = suggestedSerenoGeneration(sheet.yearsUnlife);

  const freebies = thin ? 21 : fusionFreebiesSuggested(masq);

  let v5B = fusionV5DisciplineBudget(sheet.generation, masq);
  let maxV5 = fusionMaxDotsPerDiscipline(v5B);
  let cB = fusionClassicDisciplineBudget(masq);
  let maxC = fusionMaxDotsPerDiscipline(cB);

  if (thin) {
    v5B = disciplineBudget(sheet.generation);
    maxV5 = 2;
    cB = 3;
    maxC = 5;
  }

  return {
    masqueradeGeneration: masq,
    suggestedSerenoGeneration: suggestedCategory,
    freebiesSuggested: freebies,
    v5DisciplineBudget: v5B,
    v5MaxPerDot: maxV5,
    classicDisciplineBudget: cB,
    classicMaxPerDot: maxC,
    thinBloodNoBonus: thin,
  };
}
