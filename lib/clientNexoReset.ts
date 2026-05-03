/**
 * Reinicio controlado del cliente Nexo para mesa nueva.
 * Persiste siempre la Génesis (cronista-chronicle-v1), ajustable en Centro → Génesis.
 * Persiste servidor: motor / semilla (`/api/operator-settings`) sin tocar desde aquí.
 * Opcionalmente mantiene sincronización de campaña Redis (`cronista-campaign-sync-v1`).
 */

import { emptySheet, saveSheet } from "@/lib/character";
import {
  wipeAllLocalProfiles,
} from "@/lib/profileStore";
import { wipeClientNexoWorld } from "@/lib/nexusWorldState";
import { resetNarrativeChannel, saveActiveStrand } from "@/lib/narrativeMemory";
import { saveXpLog, saveMeta, defaultMeta } from "@/lib/sessionMeta";
import { setPendingSynapticDisruption } from "@/lib/chronicleConfig";

export type ClientFactoryResetOptions = {
  /** Si false, preserva sala/código jugador Redis (local). Default true. */
  preserveCampaignSync?: boolean;
};

/** Único punto Mesa real: mismo arranque base en cada navegador al pulsar Centro de Mandos (Génesis intacta). */
export function factoryResetLocalNexoPreserveGenesis(opts?: ClientFactoryResetOptions): void {
  if (typeof window === "undefined") return;

  wipeAllLocalProfiles();
  wipeClientNexoWorld();
  setPendingSynapticDisruption("");
  saveXpLog([]);
  resetNarrativeChannel({ clearIdeas: true, clearMj: true });

  saveMeta(defaultMeta());
  saveSheet(emptySheet());
  saveActiveStrand("principal");

  if (opts?.preserveCampaignSync === false) {
    try {
      window.localStorage.removeItem("cronista-campaign-sync-v1");
    } catch {
      /* ignore */
    }
  }

  /** Bitácora pública cliente (opcional). */
  try {
    window.localStorage.removeItem("cronista-bitacora-dual-v1");
    window.localStorage.removeItem("cronista-bitacora-publica-v1");
    window.localStorage.removeItem("cronista-bitacora-cache-v1");
  } catch {
    /* ignore */
  }
}
