import type { SectKnowledge } from "@/data/knowledge/types";

export const sects = {
  camarilla: {
    ideology: "control institucional y Masquerada — secreto ante mortales.",
    style: "político cortés · convocatorias cerradas · deuda reputacional",
  },

  sabbat: {
    ideology: "abolición de máscaras vampíricas impuestas — monstruo afirmado.",
    style: "violento ritualizado · pacto de guerra contra el Estado de la Sangre típico",
  },

  anarch: {
    ideology: "libertad frente príncipes y métricas ajenas de obediencia.",
    style: "caótico disperso · redes informales · lealtad táctica cambiante",
  },

  independent: {
    ideology: "intereses propios de linaje/culto — pactos externos variables.",
    style: "variable — embajadas de sombra más que protocolo camarilla estándar",
  },
} as const satisfies Record<string, SectKnowledge>;

export type SectKnowledgeKey = keyof typeof sects;
