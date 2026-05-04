import type { CharacterSheet } from "@/lib/character";
import type { SoloOption } from "./types";
import { checkOptionAvailability } from "./requirementEngine";

/** Caminos que dependen sólo del Codex: disciplina, habilidad, atributo, clan incompatible. `none` sigue abierto siempre. */
export function isSoloOptionGatedOnSheet(option: SoloOption): boolean {
  return option.requirement.type !== "none";
}

/**
 * Oculta tiradas/disciplinas u otros requisitos que la ficha no cumple para priorizar opciones jugables y diálogo.
 * Si nada coincide (contenido roto improbable), se muestran todas como antes.
 */
export function filterSoloOptionsForSheet(options: SoloOption[], sheet: CharacterSheet): SoloOption[] {
  const filtered = options.filter((option) => {
    if (!isSoloOptionGatedOnSheet(option)) return true;
    return checkOptionAvailability(option, sheet).available;
  });
  if (filtered.length === 0) return options;
  return filtered;
}

/** Diálogo sin requisitos primero; luego estable por id. */
export function sortSoloOptionsForDisplay(options: SoloOption[]): SoloOption[] {
  return [...options].sort((a, b) => {
    const pri = (o: SoloOption) => (o.requirement.type === "none" ? 0 : 1);
    const d = pri(a) - pri(b);
    return d !== 0 ? d : a.id.localeCompare(b.id);
  });
}
