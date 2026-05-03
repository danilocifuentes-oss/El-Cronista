import type { NexoOrchestrationState } from "./types";

/**
 * Alta tensión mueve poder hacia segunda inquisición y anárquicos;
 * camarilla erosiona cuando la mesa lleva noches muy calientes sin contención.
 */
export function updateFactions(world: NexoOrchestrationState): NexoOrchestrationState {
  const t = world.threatSmoothed;
  if (t >= 4) {
    world.factions.camarilla.power = Math.max(1, Math.round(world.factions.camarilla.power - 1));
    world.factions.segunda_inquisicion.power = Math.min(
      14,
      Math.round(world.factions.segunda_inquisicion.power + (t >= 5 ? 2 : 1)),
    );
    world.factions.anarquistas.power = Math.round(world.factions.anarquistas.power + (t >= 5 ? 1 : 0));
  } else if (t <= 1.5) {
    world.factions.camarilla.power = Math.min(12, Math.round(world.factions.camarilla.power + 0));
    world.factions.anarquistas.power = Math.max(1, Math.round(world.factions.anarquistas.power - 0));
  }

  const cam = world.factions.camarilla.power;
  if (cam <= 3 && !world.globalFlags.includes("camarilla_fragil")) {
    world.globalFlags.push("camarilla_fragil");
  }
  if (world.factions.segunda_inquisicion.power >= 10 && !world.globalFlags.includes("inquisicion_dominante")) {
    world.globalFlags.push("inquisicion_dominante");
  }

  return world;
}
