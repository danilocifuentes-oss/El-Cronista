import type { NarrativeStrand } from "@/lib/narrativeStrands";

/** Rol en el canal SchreckNet del Nexo. */
export type NarrativeRole = "narrador" | "jugador" | "sistema";

export type NarrativeLogEntry = {
  id: string;
  role: NarrativeRole;
  text: string;
  ts: number;
  /** Hilo narrativo: principal / paralela / en vivo (mesa física). Ausente = principal (legacy). */
  strand?: NarrativeStrand;
  /** Respuesta del motor Cronista (MANIFESTAR): estilo terminal degradado */
  cronistaOut?: boolean;
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
};

/** Respuesta API → cliente */
export type NarradorApiResponse = {
  narration: string;
  rollingSummary?: string;
};
