import { INQUISITION_ARC } from "./storySystem";
import type { NexoOrchestrationState } from "./types";

/** Texto condensado para el LLM; no devolver al cliente como UI fija. */
export function formatOrchestrationForPrompt(world: NexoOrchestrationState): string {
  const fac = Object.entries(world.factions)
    .map(([k, v]) => `${k}:${v.power}`)
    .join(" · ");
  const flags = world.globalFlags.slice(-8).join(", ") || "—";
  const events = world.activeEvents
    .slice(-4)
    .map((e) => `${e.type}(i${e.intensity})`)
    .join("; ") || "—";
  const npcSample = Object.entries(world.npcs)
    .slice(0, 5)
    .map(([id, n]) => `${id}:${n.mood}[${n.memories.slice(-1)[0]?.slice(0, 40) ?? "—"}]`)
    .join(" | ") || "—";

  return [
    `noche ${world.night} · pulso ${world.pulse} · σ suavizado ${world.threatSmoothed.toFixed(2)}`,
    `facciones: ${fac}`,
    `banderas: ${flags}`,
    `eventos activos: ${events}`,
    `NPCs (muestra): ${npcSample}`,
    `arco fase índice: ${world.storyPhase}/${INQUISITION_ARC.phases.length}`,
  ].join("\n");
}
