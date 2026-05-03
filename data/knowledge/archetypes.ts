/**
 * Arcos tácticos frecuentes en mesa — el motor puede alinear beats sugeridos o capas LLM sin fijar clase de personaje.
 */
export const archetypes = {
  predator: {
    label: "depredador",
    focus: "iniciativa · consecuencias físicas rápidas",
    intentHints: ["violence", "move", "survival_probe"] as const,
  },
  broker: {
    label: "intermediario",
    focus: "deuda verbal · rumor como moneda",
    intentHints: ["social", "examine"] as const,
  },
  archivist: {
    label: "archivista clandestino",
    focus: "lectura antes del contacto · mapa de vínculos",
    intentHints: ["examine", "magic"] as const,
  },
  survivor: {
    label: "sobreviviente de barrio",
    focus: "rutas tácticas · tolerancia al desgaste",
    intentHints: ["flee", "localization", "survival_probe"] as const,
  },
} as const;

export type ArchetypeKnowledgeKey = keyof typeof archetypes;
