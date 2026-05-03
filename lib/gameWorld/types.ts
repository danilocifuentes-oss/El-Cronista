export type WorldFactionId = "camarilla" | "anarquistas" | "segunda_inquisicion";

export type NexoOrchestrationNPC = {
  mood: "neutral" | "tenso" | "hostil";
  memories: string[];
  lastSeen: number;
};

export type GlobalOrchestrationEvent = {
  id: string;
  type: string;
  intensity: number;
  detail?: string;
  createdAt: number;
};

export type OrchestrationLogLine = {
  ts: number;
  tag: "canal" | "manifestar" | "comando" | "sistema";
  note: string;
};

/**
 * Estado orquestado en servidor (separado del `nexusWorldState` en localStorage del cliente).
 * Alimenta continuidad emergente: facciones, memoria colectiva, arco, crisis puntuales.
 */
export type NexoOrchestrationState = {
  version: 1;
  /** Pulso de turnos servidor (cada invocación narrador/manifestar incrementa). */
  pulse: number;
  /** Noche diegética derivada de pulso (ajustable por comando). */
  night: number;
  /** 0–5 alineado con σ de mesa; se suaviza con lecturas sucesivas. */
  threatSmoothed: number;
  factions: Record<WorldFactionId, { power: number }>;
  globalFlags: string[];
  activeEvents: GlobalOrchestrationEvent[];
  npcs: Record<string, NexoOrchestrationNPC>;
  /** Índice en `STORY_PHASES` (arco inquisición / ciudad). */
  storyPhase: number;
  log: OrchestrationLogLine[];
  updatedAt: number;
};
