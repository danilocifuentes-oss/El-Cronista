import type { PathKnowledge } from "@/data/knowledge/types";

/** Sendas Sabbat-like (tono moral alternativo para crónicas donde aplique — no todas las fichas cargan campo explícito). */
export const paths = {
  path_night: {
    name: "Senda de la Noche",
    theme: "aceptación explícita de la condición predatoria — menos culpa institucional, más pacto oscuro.",
  },

  path_power: {
    name: "Senda del Poder",
    theme: "dominio materno antes que compasión — la moralidad se mide en control mantenido.",
  },

  path_harmony: {
    name: "Senda de la Armonía",
    theme: "equilibrio ritual con la Bestia codificada — tabúes cerrados ante impulsos ciegos.",
  },
} as const satisfies Record<string, PathKnowledge>;

export type SabbatPathKey = keyof typeof paths;
