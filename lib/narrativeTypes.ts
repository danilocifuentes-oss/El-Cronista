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

/** Payload cliente → POST /api/narrador */
export type NarradorRequestBody = {
  playerAction: string;
  recentLogs: NarradorRecentLine[];
  sheetSummary: string;
  inquisitionThreat: number;
  mjDirectives: string[];
  rollingSummary?: string;
};

/** Respuesta API → cliente */
export type NarradorApiResponse = {
  narration: string;
  rollingSummary?: string;
};
