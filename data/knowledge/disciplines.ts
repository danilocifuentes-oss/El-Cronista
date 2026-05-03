import type { DisciplineKnowledge } from "@/data/knowledge/types";

/**
 * Gatillos narrativos por disciplina: el motor traduce «use» en sugerencias y el LLM abre vectores escénicos.
 * Claves deben cuadrar con `DISCIPLINE_POOL` donde existan; extras (oblivion, vicissitude, serpentis) son lore-first.
 */
export const disciplines = {
  auspex: {
    type: "percepción",
    narrative: ["capas ocultas de verdad", "presagios que no querés tener"],
    use: "detección y lectura antes del contacto físico",
  },

  celerity: {
    type: "físico explosivo",
    narrative: ["movimientos ilegibles para ojo mortal", "ritmo que roba iniciativa"],
    use: "velocidad táctica · cierre de distancia · huida abrupta",
  },

  dominate: {
    type: "mental imperativo",
    narrative: ["imposiciones que se sienten como propias", "vacíos donde debería haber desacuerdo"],
    use: "imposición de conducta verbal o encadenada corta",
  },

  fortitude: {
    type: "defensa",
    narrative: ["golpes que encuentran piedra antes que carne", "postura ante daño vulgar"],
    use: "absorber consecuencias físicas o presión contextual",
  },

  obfuscate: {
    type: "sigilo perceptivo",
    narrative: ["ser olvidado a mitad de frase", "ausencia plausible"],
    use: "evadir testigos y vigilancia rutinaria",
  },

  potence: {
    type: "fuerza",
    narrative: ["impacts que deforman herrajes", "trabajo bruto antes del discurso"],
    use: "daño físico resolutivo o demostración de amenaza",
  },

  presence: {
    type: "social sobrenatural",
    narrative: ["carisma cargado antes del argumento", "espacio ocupado sin llegar tocando"],
    use: "influencia reputacional rápida o calibrar jerarquía",
  },

  animalism: {
    type: "vínculo bestial",
    narrative: ["ojos salvajes que acuerdan prioridades", "lenguajes que no llevan léxico mortal"],
    use: "sondeo territorial vía fauna o aliados no humanos",
  },

  protean: {
    type: "transformación",
    narrative: ["líneas corporales borrosas bajo tensión", "refugios en anatomía nueva"],
    use: "adaptación corporal urgente · sombra corpórea",
  },

  blood_sorcery: {
    type: "taumaturgia de sangre",
    narrative: ["geometría trazada con hemoglobina", "promesas que el cuerpo paga después"],
    use: "hechicería con coste vampírico medible como hambre o marca",
  },

  oblivion: {
    type: "oscuridad viviente",
    narrative: ["materia oscura pegajosa más allá del apagón común", "silencios que tienen masa"],
    use: "ofuscación táctica brutal o corrupción estable",
  },

  vicissitude: {
    type: "escultura de carne",
    narrative: ["hueso que ordena nueva topografía", "espanto corporal dirigido"],
    use: "horror corporal — daño deformante amenazante o sanación grotesca",
  },

  serpentis: {
    type: "sierpe / tentación física",
    narrative: ["lenguajes de lenguaje y piel lentos", "tentación con colmillo ceremonial"],
    use: "corromper vínculos o desestabilizar lealtades con símbolo corporal",
  },
} as const satisfies Record<string, DisciplineKnowledge>;

export type DisciplineKnowledgeKey = keyof typeof disciplines;
