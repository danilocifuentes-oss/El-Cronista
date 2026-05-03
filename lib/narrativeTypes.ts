import type { NarrativeStrand } from "@/lib/narrativeStrands";

/** Rol en el canal SchreckNet del Nexo. */
export type NarrativeRole = "narrador" | "jugador" | "sistema";

/** Señal heurística: conviene lanzar tirada antes de improvisar consecuencias finales (apoya V5 sobre tu CODEX). */
export type NarradorRollPrompt = {
  nivel: "opcional" | "recomendada" | "urgente";
  enfoque: string;
};

export type NarrativeLogEntry = {
  id: string;
  role: NarrativeRole;
  text: string;
  ts: number;
  /** Hilo narrativo: principal / paralela / en vivo (mesa física). Ausente = principal (legacy). */
  strand?: NarrativeStrand;
  /** Respuesta del motor Cronista (MANIFESTAR): estilo terminal degradado */
  cronistaOut?: boolean;
  /** Pistas opcionales del narrador IA (motor canal jugador); no Cronista MANIFESTAR. */
  suggestions?: string[];
  rollPrompt?: NarradorRollPrompt;
  /** Pulso σ: UI puede aplicar jitter / glitch en mensajes `sistema`. */
  sigmaGlitch?: boolean;
  /** Hambre alta: acento «Bestia» en narración interna. */
  beastTone?: boolean;
};

export type NarradorRecentLine = {
  role: NarrativeRole | string;
  text: string;
};

/** Configuración diegética enviada al narrador (Génesis / capas automáticas). */
export type ChroniclePayload = {
  foundations?: string;
  AMBIENTE?: string;
  TENSION?: string;
  ESTADO_GLOBAL?: string;
  /** Cómo se enlazan los tres hilos en tu crónica (opcional, alta prioridad diegética). */
  VINCULO_HILOS?: string;
};

/** Payload cliente → POST /api/narrador */
export type NarradorRequestBody = {
  playerAction: string;
  recentLogs: NarradorRecentLine[];
  sheetSummary: string;
  inquisitionThreat: number;
  mjDirectives: string[];
  rollingSummary?: string;
  chronicle?: ChroniclePayload;
  /** Prioridad máxima: inyección del operador (una escena forzada). */
  synapticDisruption?: string;
  /**
   * Notas persistentes de mesa: arcos, ideas, continuidad — no es el log del canal.
   * El cliente lo guarda en localStorage; limpiar para iterar versiones narrativas.
   */
  ideasRepository?: string;
  /** Hilo activo en el Nexo. */
  narrativeStrand?: NarrativeStrand;
  /** Resúmenes de otros hilos (continuidad cruzada). */
  crossStrandContext?: string;
  /**
   * Bloque Nexo: era, ecos mundiales, flags, misiones; evita «día 1» artificial.
   * Lo genera el cliente desde `nexusWorldState` + hilo activo.
   */
  worldNexusContext?: string;
  /**
   * Clave opcional (ASCII) para memoria servidor de orquestación: PJ o NPC (`pj:Lucas`, `npc:Mercader`).
   * Si falta, el pulso registra tensión/arco pero no segmenta memorias por entidad.
   */
  orchestrationNpcKey?: string;
};

/** Extensión JSON solo cuando responde el motor interno Nexo v1 (sin LLM externo). */
export type NexoInternalV1ApiPayload = {
  sigmaTier: number;
  systemWhispers: string[];
};

/** Respuesta API → cliente */
export type NarradorApiResponse = {
  narration: string;
  rollingSummary?: string;
  /** 2–4 ideas de siguiente paso para el jugador (opcional). */
  suggestions?: string[];
  /** Presente cuando el motor estima tirada antes de improvisar consecuencias. */
  rollPrompt?: NarradorRollPrompt;
  /** σ + susurros SchreckNet (motor interno). */
  nexoInternalV1?: NexoInternalV1ApiPayload;
};
