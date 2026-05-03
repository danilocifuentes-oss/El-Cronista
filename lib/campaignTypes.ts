import type { NarrativeRole } from "@/lib/narrativeTypes";
import type { NarrativeStrand } from "@/lib/narrativeStrands";
import { normalizeStrand } from "@/lib/narrativeStrands";

export const CAMPAIGN_ID_MAX = 48;
export const CAMPAIGN_TAG_MAX = 40;
export const CAMPAIGN_TEXT_MAX = 4500;

export type CampaignWireEntry = {
  id: string;
  ts: number;
  playerTag: string;
  strand: NarrativeStrand;
  role: NarrativeRole;
  text: string;
};

export type CampaignRoomBlob = {
  version: 1;
  entries: CampaignWireEntry[];
};

export function defaultCampaignBlob(): CampaignRoomBlob {
  return { version: 1, entries: [] };
}

const ROLES: NarrativeRole[] = ["narrador", "jugador", "sistema"];

export function isNarrativeRole(s: string): s is NarrativeRole {
  return (ROLES as readonly string[]).includes(s);
}

/** ID de sala: letras/números/guiones, sin espacios. */
export function normalizeCampaignId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/gi, "")
    .slice(0, CAMPAIGN_ID_MAX);
}

export function normalizePlayerTag(raw: string): string {
  return raw.trim().slice(0, CAMPAIGN_TAG_MAX);
}

export function parseCampaignPostBody(o: Record<string, unknown>): CampaignWireEntry | null {
  const id = typeof o.id === "string" ? o.id.trim().slice(0, 64) : "";
  const text = typeof o.text === "string" ? o.text.slice(0, CAMPAIGN_TEXT_MAX) : "";
  const playerTag = normalizePlayerTag(typeof o.playerTag === "string" ? o.playerTag : "");
  const strand = normalizeStrand(typeof o.strand === "string" ? o.strand : "principal");
  const roleRaw = typeof o.role === "string" ? o.role.trim() : "";
  const role = isNarrativeRole(roleRaw) ? roleRaw : null;
  const ts = Number(o.ts);
  if (!id || !text.trim() || !role || !playerTag) return null;
  return {
    id,
    ts: Number.isFinite(ts) && ts > 0 ? Math.floor(ts) : Date.now(),
    playerTag,
    strand,
    role,
    text: text.trim(),
  };
}
