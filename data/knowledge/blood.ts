/** Bandas declarativas (texto CODEX suele tener generación tipo Sereno: neonato / ancilla). */
export const blood = {
  generationLabel: {
    neonato: "sangre joven — presupuestos ajustados, apetito aún aprendiendo protocolo nocturno.",
    ancilla: "no-vida con bagaje — disciplina con más tracción social y deuda acumulada creíble.",
    /** Si el motor no reconoce el literal, cae al narrador como equilibrio semántico. */
    unknown: "línea generacional no acotada — jugá intensidad según crónica, no por manual.",
  },

  /** Efectos diegéticos asociados a potencia alta (traducción narrativa, no tabla). */
  potencyEffects: [
    "mayor tracción supernatural en consecuencias inmediatas",
    "presión sobre hambre y control del impulso",
    "margen menor para fingir mortalidad rutinaria",
    "firmas perceptibles para otros Kindred cercanos sin que medie palabra",
  ],
} as const;
