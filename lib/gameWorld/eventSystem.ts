import type { GlobalOrchestrationEvent, NexoOrchestrationState } from "./types";

function nid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Crisis puntuales: baja probabilidad por pulso para no saturar prompts. */
export function maybeSpawnGlobalEvents(world: NexoOrchestrationState): NexoOrchestrationState {
  const roll = Math.random();
  if (roll < 0.06 && world.threatSmoothed >= 2) {
    world.activeEvents.push({
      id: nid(),
      type: "raid_inquisicion",
      intensity: Math.min(5, Math.max(2, Math.round(world.threatSmoothed))),
      detail: "operativo en distrito céntrico",
      createdAt: Date.now(),
    });
  }
  if (roll < 0.1 && roll > 0.04 && world.globalFlags.some((g) => g.includes("purga"))) {
    world.activeEvents.push({
      id: nid(),
      type: "desaparicion_npc",
      intensity: 2,
      detail: "figura menor desaparece del mapa público",
      createdAt: Date.now(),
    });
  }

  world.activeEvents = world.activeEvents.filter((e) => Date.now() - e.createdAt < 72 * 3600 * 1000).slice(-12);
  return world;
}

/** Comando MJ: fuerza un evento. */
export function pushCommandEvent(world: NexoOrchestrationState, e: Omit<GlobalOrchestrationEvent, "id" | "createdAt">): void {
  world.activeEvents.push({
    ...e,
    id: nid(),
    createdAt: Date.now(),
  });
}
