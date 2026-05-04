import type { CharacterSheet } from "@/lib/character";
import { disciplineLabel } from "@/lib/sereno";
import type { SoloOption, SoloRequirement } from "./types";

export type RequirementResult = {
  available: boolean;
  reason?: string;
};

function evalRequirement(req: SoloRequirement, sheet: CharacterSheet): RequirementResult {
  switch (req.type) {
    case "none":
      return { available: true };
    case "clan":
      return req.clan === sheet.clan
        ? { available: true }
        : { available: false, reason: `Sólo para ${req.clan}.` };
    case "discipline": {
      const current = Number(sheet.disciplines?.[req.discipline] ?? 0);
      return current >= req.minLevel
        ? { available: true }
        : {
            available: false,
            reason: `${disciplineLabel(req.discipline)} ${current}/${req.minLevel}.`,
          };
    }
    case "skill": {
      const current = Number(sheet.skills?.[req.skill] ?? 0);
      return current >= req.minLevel
        ? { available: true }
        : { available: false, reason: `${req.skill} ${current}/${req.minLevel}.` };
    }
    case "attribute": {
      const current = Number(sheet.attributes?.[req.attribute] ?? 0);
      return current >= req.minLevel
        ? { available: true }
        : { available: false, reason: `${req.attribute} ${current}/${req.minLevel}.` };
    }
    default:
      return { available: true };
  }
}

export function checkOptionAvailability(option: SoloOption, sheet: CharacterSheet): RequirementResult {
  return evalRequirement(option.requirement, sheet);
}

export function listFailReasons(option: SoloOption, sheet: CharacterSheet): string[] {
  const state = checkOptionAvailability(option, sheet);
  return state.available || !state.reason ? [] : [state.reason];
}

export function resolveDisciplineTierText(option: SoloOption, sheet: CharacterSheet): string {
  if (!option.discipline || !option.textByDisciplineLevel) return option.text;
  const current = Number(sheet.disciplines?.[option.discipline] ?? 0);
  const eligibleTier = Object.keys(option.textByDisciplineLevel)
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v) && v <= current)
    .sort((a, b) => b - a)[0];
  if (!eligibleTier) return option.text;
  return option.textByDisciplineLevel[eligibleTier] ?? option.text;
}
