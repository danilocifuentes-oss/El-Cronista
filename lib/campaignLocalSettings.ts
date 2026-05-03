const LS_KEY = "cronista-campaign-sync-v1";

export type CampaignSyncSettings = {
  enabled: boolean;
  campaignId: string;
  playerTag: string;
};

export function defaultCampaignSyncSettings(): CampaignSyncSettings {
  return {
    enabled: false,
    campaignId: "",
    playerTag: "",
  };
}

export function loadCampaignSyncSettings(): CampaignSyncSettings {
  if (typeof window === "undefined") return defaultCampaignSyncSettings();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultCampaignSyncSettings();
    const j = JSON.parse(raw) as Partial<CampaignSyncSettings>;
    const d = defaultCampaignSyncSettings();
    return {
      enabled: Boolean(j.enabled),
      campaignId: typeof j.campaignId === "string" ? j.campaignId.trim().slice(0, 52) : d.campaignId,
      playerTag: typeof j.playerTag === "string" ? j.playerTag.trim().slice(0, 44) : d.playerTag,
    };
  } catch {
    return defaultCampaignSyncSettings();
  }
}

export function saveCampaignSyncSettings(s: CampaignSyncSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}
