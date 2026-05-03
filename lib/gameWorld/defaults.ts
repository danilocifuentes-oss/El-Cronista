import type { NexoOrchestrationState } from "./types";

export function defaultOrchestrationState(): NexoOrchestrationState {
  return {
    version: 1,
    pulse: 0,
    night: 1,
    threatSmoothed: 0,
    factions: {
      camarilla: { power: 7 },
      anarquistas: { power: 5 },
      segunda_inquisicion: { power: 3 },
    },
    globalFlags: [],
    activeEvents: [],
    npcs: {},
    storyPhase: 0,
    log: [],
    updatedAt: Date.now(),
  };
}
