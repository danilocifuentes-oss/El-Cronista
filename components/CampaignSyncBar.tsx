"use client";

import { useCallback, useMemo } from "react";
import type { CampaignSyncSettings } from "@/lib/campaignLocalSettings";
import { normalizeCampaignId } from "@/lib/campaignTypes";

type Props = {
  value: CampaignSyncSettings;
  onChange: (next: CampaignSyncSettings) => void;
  remoteStoreReady: boolean;
};

export function CampaignSyncBar({ value, onChange, remoteStoreReady }: Props) {
  const cidNorm = useMemo(() => normalizeCampaignId(value.campaignId), [value.campaignId]);

  const bump = useCallback(
    (patch: Partial<CampaignSyncSettings>) => {
      onChange({ ...value, ...patch });
    },
    [onChange, value],
  );

  const genId = () => {
    const slug = `mesa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    bump({ campaignId: slug });
  };

  return (
    <div className="border-b border-[#27272f] bg-black/55 px-4 py-2 font-mono text-[9px] text-neutral-500 lg:px-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
        <label className="flex cursor-pointer items-center gap-2 shrink-0">
          <input
            type="checkbox"
            checked={value.enabled}
            disabled={!remoteStoreReady}
            onChange={(e) => bump({ enabled: e.target.checked })}
            className="accent-[var(--terminal)]"
          />
          <span className={remoteStoreReady ? "" : "text-neutral-600"}>
            Sala remota · misma campaña ({remoteStoreReady ? "Redis OK" : "requiere Upstash"})
          </span>
        </label>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="id-sala-compartida"
            value={value.campaignId}
            disabled={!remoteStoreReady}
            onChange={(e) => bump({ campaignId: e.target.value.slice(0, 52) })}
            className="min-w-[10rem] flex-1 border border-[#333] bg-black/60 px-2 py-1 text-[10px] text-neutral-300 placeholder:text-neutral-700 disabled:opacity-40"
          />
          <button
            type="button"
            disabled={!remoteStoreReady}
            onClick={genId}
            className="shrink-0 border border-[#38383f] px-2 py-1 text-[8px] uppercase tracking-wider text-neutral-500 hover:border-neutral-600 hover:text-neutral-300 disabled:opacity-40"
          >
            Nueva sala
          </button>
          <input
            type="text"
            placeholder="Etiqueta jugador (mesa)"
            title="Aparece como prefijo en el hilo compartido para otros jugadores."
            value={value.playerTag}
            disabled={!remoteStoreReady}
            onChange={(e) => bump({ playerTag: e.target.value.slice(0, 44) })}
            className="w-[min(100%,12rem)] border border-[#333] bg-black/60 px-2 py-1 text-[10px] text-neutral-300 placeholder:text-neutral-700 disabled:opacity-40"
          />
          {value.enabled && cidNorm ? (
            <span className="text-[8px] uppercase tracking-[0.22em] text-neutral-600">
              sync · {cidNorm.slice(0, 14)}
              {cidNorm.length > 14 ? "…" : ""}
            </span>
          ) : null}
        </div>

        <p className="max-w-xl text-[8px] leading-snug text-neutral-600 lg:text-right">
          Opcional: todos usan el mismo ID + etiqueta distinta; el hilo <strong className="font-normal text-neutral-500">Mesa grupal</strong> fusiona
          turnos para el narrador.
        </p>
      </div>
    </div>
  );
}
