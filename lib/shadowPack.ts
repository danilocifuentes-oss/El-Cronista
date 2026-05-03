import type { CharacterSheet } from "@/lib/character";
import { defaultDisciplines, emptySheet, normalizeCharacterSheet } from "@/lib/character";
import { CLAN_DISCIPLINE_TRIO, type DisciplineKey } from "@/lib/sereno";

function applyDisc(
  clan: CharacterSheet["clan"],
  triple: [number, number, number],
): Record<string, number> {
  const d = defaultDisciplines();
  const k = CLAN_DISCIPLINE_TRIO[clan] as readonly [DisciplineKey, DisciplineKey, DisciplineKey];
  d[k[0]] = triple[0];
  d[k[1]] = triple[1];
  d[k[2]] = triple[2];
  return d;
}

function base(): CharacterSheet {
  return emptySheet();
}

/** El Enlace — burócrata Ventrue. */
export function sheetElEnlace(): CharacterSheet {
  const s = base();
  return normalizeCharacterSheet({
    ...s,
    name: "El Enlace",
    clan: "ventrue",
    isNPC: true,
    concept: "Funcionario de conexión entre licitaciones y contratos; la sangre pasa factura.",
    yearsUnlife: 45,
    generation: "ancilla",
    attributes: { str: 2, dex: 2, sta: 3, cha: 4, man: 4, com: 3, int: 3, wit: 3, res: 3 },
    skills: {
      ...s.skills,
      etiqueta: 3,
      politica: 4,
      financias: 3,
      persuasion: 2,
      intimidacion: 2,
    },
    disciplines: applyDisc("ventrue", [2, 1, 1]),
    hunger: 2,
    humanity: 6,
    resonance: "Flemática",
  });
}

/** Sombra-01 — Nosferatu informante. */
export function sheetSombra01(): CharacterSheet {
  const s = base();
  return normalizeCharacterSheet({
    ...s,
    name: "Sombra-01",
    clan: "nosferatu",
    isNPC: true,
    concept: "Ojos en alcantarilla y fibre óptica robada; vende rutas que nadie quiere mapear.",
    yearsUnlife: 22,
    generation: "neonato",
    attributes: { str: 3, dex: 3, sta: 3, cha: 1, man: 2, com: 2, int: 3, wit: 4, res: 3 },
    skills: {
      ...s.skills,
      sigilo: 3,
      tecnologia: 4,
      callejeo: 3,
      investigacion: 2,
      ocultismo: 1,
    },
    disciplines: applyDisc("nosferatu", [1, 1, 0]),
    hunger: 3,
    humanity: 7,
    resonance: "Melancólica",
  });
}

/** Vástago Errante — Gangrel vigilante de periferia. */
export function sheetVastagoErrante(): CharacterSheet {
  const s = base();
  return normalizeCharacterSheet({
    ...s,
    name: "Vástago Errante",
    clan: "gangrel",
    isNPC: true,
    concept: "Nómada de cordillera y peajes; huele el cazador antes de verlo.",
    yearsUnlife: 30,
    generation: "neonato",
    attributes: { str: 3, dex: 3, sta: 4, cha: 2, man: 2, com: 2, int: 2, wit: 3, res: 4 },
    skills: {
      ...s.skills,
      supervivencia: 4,
      atletismo: 3,
      combate_cac: 2,
      conducir: 2,
      sigilo: 2,
    },
    disciplines: applyDisc("gangrel", [1, 1, 0]),
    hunger: 2,
    humanity: 5,
    resonance: "Colérica",
  });
}

export const SHADOW_PACK_SHEETS: CharacterSheet[] = [sheetElEnlace(), sheetSombra01(), sheetVastagoErrante()];
