import { Redis } from "@upstash/redis";

import { normalizeOrchestrationState } from "./stateMerge";
import type { NexoOrchestrationState } from "./types";

const KEY = "nexo:orchestration:v1";
const TTL_SECONDS = 60 * 60 * 24 * 120;

function client(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url?.trim() || !token?.trim()) return null;
  return new Redis({ url: url.trim(), token: token.trim() });
}

export function isOrchestrationRedisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim());
}

export async function redisLoadOrchestration(): Promise<NexoOrchestrationState | null> {
  const r = client();
  if (!r) return null;
  const raw = await r.get(KEY);
  if (raw == null || raw === "") return null;
  try {
    const parsed: unknown = typeof raw === "string" ? JSON.parse(raw) : raw;
    return normalizeOrchestrationState(parsed);
  } catch {
    return null;
  }
}

export async function redisSaveOrchestration(world: NexoOrchestrationState): Promise<void> {
  const r = client();
  if (!r) throw new Error("ORCH_REDIS_DISABLED");
  await r.set(KEY, JSON.stringify(world), { ex: TTL_SECONDS });
}
