import { defaultOrchestrationState } from "./defaults";
import {
  isOrchestrationRedisConfigured,
  redisLoadOrchestration,
  redisSaveOrchestration,
} from "./orchestrationRedisStore";
import { loadOrchestrationDisk, saveOrchestrationDisk } from "./persistenceAsync";
import type { NexoOrchestrationState } from "./types";

/** Caché proceso: acelera sin Redis; con Redis sigue siendo la fuente de verdad en cada lectura. */
let processCache: NexoOrchestrationState | null = null;

export async function getOrchestrationWorld(): Promise<NexoOrchestrationState> {
  if (isOrchestrationRedisConfigured()) {
    try {
      const fromRedis = await redisLoadOrchestration();
      if (fromRedis) {
        processCache = fromRedis;
        return structuredClone(fromRedis);
      }
    } catch (e) {
      console.warn("[orchestration] redis read failed", e);
    }
    const disk = await loadOrchestrationDisk();
    const seed = disk ?? processCache ?? defaultOrchestrationState();
    try {
      await redisSaveOrchestration(seed);
    } catch (e) {
      console.warn("[orchestration] redis bootstrap write failed", e);
    }
    processCache = seed;
    return structuredClone(seed);
  }

  if (processCache) return structuredClone(processCache);
  const disk = await loadOrchestrationDisk();
  processCache = disk ?? defaultOrchestrationState();
  return structuredClone(processCache);
}

export async function commitOrchestrationWorld(next: NexoOrchestrationState): Promise<void> {
  next.updatedAt = Date.now();
  const frozen = structuredClone(next);
  processCache = frozen;

  if (isOrchestrationRedisConfigured()) {
    try {
      await redisSaveOrchestration(frozen);
    } catch (e) {
      console.warn("[orchestration] redis write failed", e);
    }
  }
  await saveOrchestrationDisk(frozen);
}

export async function resetOrchestrationWorld(): Promise<NexoOrchestrationState> {
  await commitOrchestrationWorld(defaultOrchestrationState());
  return getOrchestrationWorld();
}

export { defaultOrchestrationState };
