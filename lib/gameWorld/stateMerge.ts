import { defaultOrchestrationState } from "./defaults";
import type { NexoOrchestrationState } from "./types";

/** Normaliza snapshot parcial (disco / Redis / cliente) al contrato v1. */
export function normalizeOrchestrationState(raw: unknown): NexoOrchestrationState {
  const d = defaultOrchestrationState();
  if (!raw || typeof raw !== "object") return d;
  const p = raw as Partial<NexoOrchestrationState>;
  if (p.version !== 1) return d;
  return {
    ...d,
    ...p,
    pulse: typeof p.pulse === "number" && Number.isFinite(p.pulse) ? Math.max(0, Math.round(p.pulse)) : d.pulse,
    night: typeof p.night === "number" && Number.isFinite(p.night) ? Math.max(1, Math.round(p.night)) : d.night,
    threatSmoothed:
      typeof p.threatSmoothed === "number" && Number.isFinite(p.threatSmoothed)
        ? Math.min(5, Math.max(0, p.threatSmoothed))
        : d.threatSmoothed,
    storyPhase:
      typeof p.storyPhase === "number" && Number.isFinite(p.storyPhase)
        ? Math.max(0, Math.round(p.storyPhase))
        : d.storyPhase,
    factions: {
      ...d.factions,
      ...(p.factions ?? {}),
    },
    globalFlags: Array.isArray(p.globalFlags)
      ? p.globalFlags.filter((x): x is string => typeof x === "string").slice(0, 48)
      : d.globalFlags,
    activeEvents: Array.isArray(p.activeEvents) ? p.activeEvents.slice(-24) : d.activeEvents,
    npcs: typeof p.npcs === "object" && p.npcs ? p.npcs : d.npcs,
    log: Array.isArray(p.log) ? p.log.slice(-80) : d.log,
    updatedAt: typeof p.updatedAt === "number" && Number.isFinite(p.updatedAt) ? p.updatedAt : d.updatedAt,
  };
}
