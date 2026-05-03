/**
 * Etiquetas transversales (transfondo, concepto Corto matching) para enriquecer sugerencias sin parsear filosofía humana profunda.
 * Valores = frases muy cortas usables como guión interno LLM / motor.
 */
export const traits = {
  haunted: {
    cues: [/fantasma/, /fantasmas/, /culpa/, /pesadilla/, /recuerdos? vivos/, /fantasma\b/i],
    narrativeNudge:
      "síntomas del pasado interrumpen lectura presente — priorizá detalles que disparen memoria incómoda.",
  },
  territorial: {
    cues: [/territorio/, /barrio/, /esquina/, /techo/, /refugio/, /tribu urbana/i],
    narrativeNudge:
      "límites geográficos son promesas de violencia — cada calle cobra peaje social distinto.",
  },
  scholar: {
    cues: [/libro/, /archivo/, /estudio/, /ritual/, /manuscrito/, /toga/i],
    narrativeNudge:
      "compará costo de conocimiento con coste de sangre — el manual no paga hambre por vos.",
  },
} as const;
