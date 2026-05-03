import { parseFetchJson } from "@/lib/parseFetchJson";
import type { CampaignWireEntry } from "@/lib/campaignTypes";
import type { NarrativeRole } from "@/lib/narrativeTypes";
import type { NarrativeStrand } from "@/lib/narrativeStrands";

export type CampaignPushPayload = {
  campaignId: string;
  playerTag: string;
  strand: NarrativeStrand;
  role: NarrativeRole;
  text: string;
  id: string;
  ts?: number;
};

export async function fetchCampaignTail(
  campaignId: string,
  strand: NarrativeStrand,
  limit = 24,
): Promise<{ entries: CampaignWireEntry[]; storeDisabled?: boolean }> {
  try {
    const qs = new URLSearchParams({
      campaignId,
      strand,
      limit: String(limit),
    });
    const res = await fetch(`/api/campaign/entry?${qs}`, { method: "GET", cache: "no-store" });
    const data = await parseFetchJson<{ entries?: CampaignWireEntry[]; storeDisabled?: boolean; error?: string }>(res);
    if (!res.ok)
      return { entries: [], storeDisabled: Boolean((data as { storeDisabled?: boolean }).storeDisabled) };
    const entries = Array.isArray(data.entries) ? data.entries : [];
    return {
      entries: entries.filter((e) => e && typeof e.id === "string"),
      storeDisabled: data.storeDisabled,
    };
  } catch {
    return { entries: [] };
  }
}

export async function pushCampaignEntry(payload: CampaignPushPayload): Promise<boolean> {
  try {
    const res = await fetch("/api/campaign/entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId: payload.campaignId,
        playerTag: payload.playerTag,
        strand: payload.strand,
        role: payload.role,
        text: payload.text,
        id: payload.id,
        ts: payload.ts ?? Date.now(),
      }),
    });
    const data = await parseFetchJson<{ ok?: boolean; storeDisabled?: boolean }>(res);
    return res.ok && Boolean(data.ok);
  } catch {
    return false;
  }
}
