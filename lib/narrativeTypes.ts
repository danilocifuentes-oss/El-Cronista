/** Rol en el canal SchreckNet del Nexo. */
export type NarrativeRole = "narrador" | "jugador" | "sistema";

export type NarrativeLogEntry = {
  id: string;
  role: NarrativeRole;
  text: string;
  ts: number;
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
};

/** Respuesta API → cliente */
export type NarradorApiResponse = {
  narration: string;
  rollingSummary?: string;
};
