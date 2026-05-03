import type { NexoOrchestrationState } from "./types";

type Phase = {
  name: string;
  trigger: (w: NexoOrchestrationState) => boolean;
  effect: (w: NexoOrchestrationState) => void;
};

export const INQUISITION_ARC: { id: string; phases: Phase[] } = {
  id: "inquisition_arc",
  phases: [
    {
      name: "Rumores",
      trigger: (w) => w.night > 2,
      effect: (w) => {
        if (!w.globalFlags.includes("rumores_inquisicion")) w.globalFlags.push("rumores_inquisicion");
      },
    },
    {
      name: "Cacería",
      trigger: (w) => w.threatSmoothed > 3.5,
      effect: (w) => {
        if (!w.globalFlags.includes("caceria_activa")) w.globalFlags.push("caceria_activa");
      },
    },
    {
      name: "Purga",
      trigger: (w) => w.threatSmoothed > 5,
      effect: (w) => {
        if (!w.globalFlags.includes("purga_total")) w.globalFlags.push("purga_total");
      },
    },
  ],
};

export function advanceStoryPhase(world: NexoOrchestrationState): NexoOrchestrationState {
  const idx = world.storyPhase;
  const phase = INQUISITION_ARC.phases[idx];
  if (!phase) return world;
  if (phase.trigger(world)) {
    phase.effect(world);
    world.storyPhase = Math.min(world.storyPhase + 1, INQUISITION_ARC.phases.length);
  }
  return world;
}
