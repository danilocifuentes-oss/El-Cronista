/**
 * Almacén de salas de campaña (Upstash Redis). Sin env → el API indica modo solo-local.
 */

import { Redis } from "@upstash/redis";

import type { CampaignRoomBlob, CampaignWireEntry } from "@/lib/campaignTypes";
import { defaultCampaignBlob } from "@/lib/campaignTypes";

const MAX_ENTRIES = 220;
const TTL_SECONDS = 60 * 60 * 24 * 120; // 120 días

function redis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url?.trim() || !token?.trim()) return null;
  return new Redis({ url: url.trim(), token: token.trim() });
}

function key(campaignId: string): string {
  return `nexo:campaign:${campaignId}`;
}

export function isCampaignStoreConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function parseBlob(raw: unknown): CampaignRoomBlob {
  if (raw == null) return defaultCampaignBlob();
  try {
    let j: Partial<CampaignRoomBlob>;
    if (typeof raw === "string") {
      j = JSON.parse(raw) as Partial<CampaignRoomBlob>;
    } else if (typeof raw === "object" && raw !== null && Array.isArray((raw as CampaignRoomBlob).entries)) {
      j = raw as CampaignRoomBlob;
    } else {
      return defaultCampaignBlob();
    }
    if (j.version !== 1 || !Array.isArray(j.entries)) return defaultCampaignBlob();
    return { version: 1, entries: j.entries.filter(Boolean) as CampaignWireEntry[] };
  } catch {
    return defaultCampaignBlob();
  }
}

export async function campaignStoreAppend(campaignId: string, entry: CampaignWireEntry): Promise<void> {
  const r = redis();
  if (!r) throw new Error("CAMPAIGN_STORE_DISABLED");
  const k = key(campaignId);
  const prev = parseBlob(await r.get(k));
  const withoutDup = prev.entries.filter((e) => e.id !== entry.id);
  const next: CampaignRoomBlob = {
    version: 1,
    entries: [...withoutDup, entry].sort((a, b) => a.ts - b.ts).slice(-MAX_ENTRIES),
  };
  await r.set(k, JSON.stringify(next), { ex: TTL_SECONDS });
}

export async function campaignStoreList(
  campaignId: string,
  opts?: { strand?: string; limit?: number },
): Promise<CampaignWireEntry[]> {
  const r = redis();
  if (!r) throw new Error("CAMPAIGN_STORE_DISABLED");
  const k = key(campaignId);
  const blob = parseBlob(await r.get(k));
  let list = blob.entries;
  if (opts?.strand && opts.strand !== "all") {
    list = list.filter((e) => e.strand === opts.strand);
  }
  const lim = Math.min(80, Math.max(1, opts?.limit ?? 24));
  return list.slice(-lim);
}
