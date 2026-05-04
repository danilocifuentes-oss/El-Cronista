import type { CharacterSheet } from "@/lib/character";

/** Pantalla CODEX Nexo muestra hasta 7 cajones de integridad (coherente con CharacterStatusPanel). */
export const CHRONICLE_HEALTH_TRACK_UI = 7 as const;

/** Escena inicial novela donde se fuerza estado vital diegético una sola vez. */
export const CHRONICLE_OPENING_SCENE_ID = "n1_1";

/** Bandera persistida si ya se aplicó el estado inicial de primera escena. */
export const SOLO_FLAG_OPENING_VITALS = "solo_opening_vitals_applied" as const;

/** PX de crónica por tirada V5 exitosa (disciplina / habilidad / atributo / opción con pool). */
export const CHRONICLE_XP_ROLL_SUCCESS_DEFAULT = 2;

/** PX extra si el resultado es crítico (limpio o manchado). */
export const CHRONICLE_XP_CRITICAL_EXTRA = 1;

/**
 * Primera escena: integridad mínima (1/7 en HUD), presión vitae / hambruna en 1, leve merma de voluntad.
 * “Puntos de sangre” en UI del Nexo se leen como Presión Vitae (Hambre 0–5); aquí 1 = escala baja.
 */
export function applyOpeningChronicleVitals(sheet: CharacterSheet): CharacterSheet {
  const maxH = CHRONICLE_HEALTH_TRACK_UI;
  return {
    ...sheet,
    hunger: 1,
    healthDamage: maxH - 1,
    willpowerCur: Math.max(0, Math.min(sheet.willpowerMax, sheet.willpowerCur - 1)),
  };
}
