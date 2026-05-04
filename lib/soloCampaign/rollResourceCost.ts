import type { CharacterSheet } from "@/lib/character";
import type { SoloOption } from "@/lib/soloCampaign/types";

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Tirada V5 cuando la opción exige pool (disciplina, habilidad, atributo o clan con requisito). */
export function soloOptionUsesDice(option: SoloOption): boolean {
  return option.requirement.type !== "none";
}

function isDisciplineRoll(option: SoloOption): boolean {
  if (option.requirement.type === "discipline") return true;
  if (option.type === "discipline" && option.discipline) return true;
  return false;
}

const DISCIPLINE_ACTIVATION_WP = 1;
const DISCIPLINE_ACTIVATION_HUNGER_IF_NO_WP = 1;

/**
 * Coste diegético antes de resolver dados: activar disciplina gasta voluntad si hay margen;
 * si no, sube la presión de hambre (Vitae / sangre en juego).
 * Las habilidades y atributos no aplican este coste aquí.
 */
export function applyPreRollResourceCost(sheet: CharacterSheet, option: SoloOption): CharacterSheet {
  if (!isDisciplineRoll(option)) return sheet;
  if (sheet.willpowerCur >= DISCIPLINE_ACTIVATION_WP) {
    return {
      ...sheet,
      willpowerCur: clamp(sheet.willpowerCur - DISCIPLINE_ACTIVATION_WP, 0, sheet.willpowerMax),
    };
  }
  return {
    ...sheet,
    hunger: clamp(sheet.hunger + DISCIPLINE_ACTIVATION_HUNGER_IF_NO_WP, 0, 5),
  };
}

/** Reservado para UI futura (reintento de tirada): coste típico en voluntad. */
export const SOLO_REROLL_WILLPOWER_COST = 1 as const;
