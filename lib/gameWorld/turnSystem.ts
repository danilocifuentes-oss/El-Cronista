import { maybeSpawnGlobalEvents } from "./eventSystem";
import { updateFactions } from "./factionSystem";
import { rememberNPCAction } from "./npcSystem";
import { advanceStoryPhase } from "./storySystem";
import type { NexoOrchestrationState } from "./types";
import { commitOrchestrationWorld, getOrchestrationWorld } from "./worldStore";

export type OrchestrateChannelInput = {
  /** σ 0–5 del body narrador. */
  inquisitionThreat?: number;
  /** Acción libre o resumen corto (no PII agresivo). */
  actionSummary?: string;
  /** Clave estable (PJ o NPC) para memoria servidor; ver `orchestrationNpcKey` en API. */
  npcMemoryKey?: string;
  tag?: string;
};

function ingestThreat(world: NexoOrchestrationState, sigma?: number): void {
  if (typeof sigma !== "number" || Number.isNaN(sigma)) return;
  const s = Math.max(0, Math.min(5, sigma));
  world.threatSmoothed = Math.min(5, world.threatSmoothed * 0.88 + s * 0.22);
}

export async function orchestrateChannelTurn(
  input: OrchestrateChannelInput,
): Promise<NexoOrchestrationState> {
  let world = await getOrchestrationWorld();
  world.pulse += 1;
  ingestThreat(world, input.inquisitionThreat);

  if (world.pulse % 18 === 0) {
    world.night += 1;
  }

  const note = [input.tag, input.actionSummary].filter(Boolean).join(" · ").slice(0, 220);
  if (note) {
    world.log.push({ ts: Date.now(), tag: "canal", note });
  }
  if (input.npcMemoryKey && input.actionSummary) {
    rememberNPCAction(world, input.npcMemoryKey, input.actionSummary);
  }

  world = updateFactions(world);
  world = advanceStoryPhase(world);
  world = maybeSpawnGlobalEvents(world);

  world.log = world.log.slice(-80);
  await commitOrchestrationWorld(world);
  return world;
}

export async function orchestrateManifestTurn(
  summary: string,
  strand?: string,
): Promise<NexoOrchestrationState> {
  let world = await getOrchestrationWorld();
  world.pulse += 1;
  const note = [strand, summary].filter(Boolean).join(" · ").slice(0, 220);
  world.log.push({ ts: Date.now(), tag: "manifestar", note });
  world = maybeSpawnGlobalEvents(world);
  world.log = world.log.slice(-80);
  await commitOrchestrationWorld(world);
  return world;
}
