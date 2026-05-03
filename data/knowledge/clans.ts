import type { ClanKnowledgeProfile } from "@/data/knowledge/types";

export const clans = {
  // —— Camarilla / Anarquía (núcleo Sereno) ——
  brujah: {
    name: "Brujah",
    sect: ["anarch", "camarilla"],
    identity: ["rebeldía", "pasión", "violencia política"],
    curse: "temperamento explosivo — la Bestia prende con injusticia percibida.",
    hooks: ["conflicto moral", "reacción visceral", "deuda con multitudes"],
    disciplines: ["celerity", "potence", "presence"],
  },

  gangrel: {
    name: "Gangrel",
    sect: ["anarch"],
    identity: ["bestialidad funcional", "instinto territorial", "soledad elegida"],
    curse: "rasgos animales emergentes bajo tensión.",
    hooks: ["supervivencia", "territorio", "señales de fauna y calle"],
    disciplines: ["protean", "fortitude", "animalism"],
  },

  malkavian: {
    name: "Malkavian",
    sect: ["camarilla"],
    identity: ["locura productiva", "visión disonante", "caos informativo"],
    curse: "trastorno mental integrado al linaje.",
    hooks: ["profecía dudosa pero pertinente", "contradicción reveladora"],
    disciplines: ["auspex", "dominate", "obfuscate"],
  },

  nosferatu: {
    name: "Nosferatu",
    sect: ["camarilla"],
    identity: ["ocultamiento social", "red de información", "monstruo visible"],
    curse: "apariencia rechazada por Espejos y masas.",
    hooks: ["secretos", "túneles físicos y sociales"],
    disciplines: ["obfuscate", "animalism", "potence"],
  },

  toreador: {
    name: "Toreador",
    sect: ["camarilla"],
    identity: ["belleza", "arte contemporáneo", "obsesión encarnada"],
    curse: "fascinación extrema ante estímulo estético preciso.",
    hooks: ["artefactos", "emoción alta que desestabiliza prioridades"],
    disciplines: ["presence", "celerity", "auspex"],
  },

  tremere: {
    name: "Tremere",
    sect: ["camarilla"],
    identity: ["magia institucional", "control hierárquico", "ritual acotado"],
    curse: "vinculaciones de sangre heredadas con deuda camarilla típica.",
    hooks: ["conocimiento oculto pactado"],
    disciplines: ["blood_sorcery", "auspex", "dominate"],
  },

  ventrue: {
    name: "Ventrue",
    sect: ["camarilla"],
    identity: ["control ejecutivo", "poder institucional", "élite con apellido vampírico"],
    curse: "restricción de alimentación — paladares incapaces del banal mortal.",
    hooks: ["jerarquía", "capital político amortizado en favores"],
    disciplines: ["dominate", "presence", "fortitude"],
  },

  // —— Sabbat (extensión narrativa cuando la crónica / linaje lo afirman) ——
  lasombra: {
    name: "Lasombra",
    sect: ["sabbat"],
    identity: ["dominio mediante sombras", "crueldad estratégica", "autoridad que no tolera fisura"],
    curse: "reflejos ausentes · siluetas cargadas de segunda intención.",
    hooks: ["control absoluto de espacio perceptivo", "pacto militar-religioso donde aplique mesa"],
    disciplines: ["oblivion", "dominate", "potence"],
  },

  tzimisce: {
    name: "Tzimisce",
    sect: ["sabbat"],
    identity: ["laboratorio vivo", "transformación ceremonial", "terror corporal dirigido"],
    curse: "vinculación territorial profunda antes que trato cortés camarilla típico.",
    hooks: ["horror físico dirigido"],
    disciplines: ["vicissitude", "animalism", "auspex"],
  },

  // —— Independientes / cultos cuando el CODEX etiqueta LIN_IND extendido ——
  banu_haqim: {
    name: "Banu Haqim",
    sect: ["independent"],
    identity: ["juicio", "sangre de veredictos", "castigo pactado ritualmente"],
    curse: "sed intensificada hacia vampiros — vampiro como blanco plausible.",
    hooks: ["justicia ambigua aplicada antes del debate"],
    disciplines: ["celerity", "obfuscate", "blood_sorcery"],
  },

  setite: {
    name: "Ministerio (Setita)",
    sect: ["independent"],
    identity: ["corrupción consensuada", "tentación con contrato verbal"],
    curse: "vulnerabilidad simbólica a luz cruel de exposición mortal.",
    hooks: ["manipulación afectiva", "economía moral barata cara en drama posterior"],
    disciplines: ["obfuscate", "presence", "serpentis"],
  },

  // —— Cotas Sereno donde no hay libro de clan granular en esta build ——
  thin_blood: {
    name: "Thin-blood",
    sect: ["anarch", "independent"],
    identity: ["límite mortal-vampiro", "fragilidad", "tecnología cercana como refugio"],
    curse: "líneas de sangre demasiado delgadas — firmas instituciones no reconocen linaje estable.",
    hooks: ["alquimia mortal-vampirio", "fama de outsider"],
    disciplines: ["blood_sorcery", "auspex", "celerity"],
  },

  caitiff: {
    name: "Caitiff",
    sect: ["anarch", "independent"],
    identity: ["linaje ilegible", "supervivencia social", "reinventarte cada camarilla nueva"],
    curse: "estigma institucional — más presión reputacional que maldición fija.",
    hooks: ["tres disciplinas improvisadas cargan historia — no hagas génesis neutra"],
    disciplines: [], // cliente elige tres del pool Sereno — el motor debe leer CODEX factual
  },

  other: {
    name: "LIN_IND · linaje no catalogado",
    sect: ["independent", "anarch"],
    identity: ["identidad pactada fuera libro corto estándar", "ambigüedad explícita de mesa"],
    curse: "define mesa cooperativa — usar como bandera de historia custom.",
    hooks: ["negociación de rumor vivo", "lengua instituciones no cataloga igual"],
    disciplines: [],
  },
} as const satisfies Record<string, ClanKnowledgeProfile>;

export type ClanKnowledgeKey = keyof typeof clans;
