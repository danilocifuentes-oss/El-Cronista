import type { NexoOrchestrationNPC, NexoOrchestrationState } from "./types";

const MAX_MEM = 12;

export function getOrCreateNPC(world: NexoOrchestrationState, id: string): NexoOrchestrationNPC {
  if (!world.npcs[id]) {
    world.npcs[id] = {
      mood: "neutral",
      memories: [],
      lastSeen: Date.now(),
    };
  }
  return world.npcs[id];
}

export function rememberNPCAction(world: NexoOrchestrationState, id: string, action: string): void {
  const npc = getOrCreateNPC(world, id);
  const line = action.slice(0, 200);
  npc.memories.push(line);
  if (npc.memories.length > MAX_MEM) npc.memories.splice(0, npc.memories.length - MAX_MEM);

  const low = line.toLowerCase();
  if (/(amenaza|hostil|violencia|inquisici[oó]n|denuncia)/i.test(low)) {
    npc.mood = "hostil";
  } else if (/(sospecha|vigilancia|calma rota|tensi[oó]n)/i.test(low)) {
    npc.mood = npc.mood === "hostil" ? "hostil" : "tenso";
  }
  npc.lastSeen = Date.now();
}
