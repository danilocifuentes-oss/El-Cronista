"use client";

import type { ChronicleConfig } from "@/lib/chronicleConfig";
import { STRAND_LABEL, type NarrativeStrand } from "@/lib/narrativeStrands";

function clipDiegetic(s: string, max: number): string {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

type Props = {
  chronicle: ChronicleConfig;
  activeStrand: NarrativeStrand;
  inquisitionThreat: number;
  rollingSummary: string;
  /** Texto pendiente armado desde Centro de Mando (solo vista). */
  pendingSynaptic: string;
};

/**
 * Carril derecho tipo “opción 5”: Génesis viva del CV + metadatos del hilo sin duplicar toda la ficha.
 */
export function NexoChronicaRail({
  chronicle,
  activeStrand,
  inquisitionThreat,
  rollingSummary,
  pendingSynaptic,
}: Props) {
  const titleLine =
    clipDiegetic(chronicle.ESTADO_GLOBAL, 220) ||
    clipDiegetic(chronicle.TENSION, 220) ||
    clipDiegetic(chronicle.AMBIENTE, 220);

  return (
    <div className="space-y-5 font-mono text-[9px] text-neutral-500">
      <div>
        <h3 className="gothic-title mb-3 text-[10px] uppercase tracking-[0.32em] text-neutral-400">
          Crónica actual
        </h3>
        <p className="text-[11px] font-sans leading-relaxed tracking-tight text-neutral-300">{titleLine || "Sin estado global cargado · edita Génesis desde Centro / local."}</p>
      </div>

      <div className="rounded-xl border border-[#323238] bg-black/35 p-3">
        <p className="mb-1 text-[8px] uppercase tracking-widest text-neutral-600">Hilo Nexo</p>
        <p className="text-[color:var(--neon)]">{STRAND_LABEL[activeStrand]}</p>
        <p className="mt-2 text-[8px] uppercase tracking-widest text-neutral-600">Amenaza inquisitorial</p>
        <p className="text-neutral-200">σ = {inquisitionThreat}</p>
      </div>

      {pendingSynaptic.trim() ? (
        <div className="rounded-xl border border-[#7f1d1d]/40 bg-[color:var(--crimson)]/[0.08] p-3 text-neutral-400">
          <p className="mb-1 text-[8px] uppercase tracking-[0.28em] text-[color:var(--crimson)]">Disrupción armada</p>
          <p className="whitespace-pre-wrap font-sans text-[10px] leading-snug">{clipDiegetic(pendingSynaptic, 420)}</p>
        </div>
      ) : null}

      {rollingSummary.trim() ? (
        <div>
          <p className="mb-1 text-[8px] uppercase tracking-widest text-neutral-600">Resumen del hilo activo</p>
          <p className="whitespace-pre-wrap font-sans text-[10px] leading-relaxed text-neutral-400">
            {clipDiegetic(rollingSummary, 900)}
          </p>
        </div>
      ) : (
        <p className="text-[9px] italic text-neutral-600">Aún sin resumen de escena para este hilo.</p>
      )}

      <div className="rounded-xl border border-[#323238]/90 bg-black/40 p-3">
        <p className="mb-2 text-[8px] uppercase tracking-widest text-neutral-600">Génesis · Ambiente</p>
        <p className="font-sans text-[10px] leading-relaxed text-neutral-400">{clipDiegetic(chronicle.AMBIENTE, 360)}</p>
        <p className="mb-2 mt-4 text-[8px] uppercase tracking-widest text-neutral-600">Tensión</p>
        <p className="font-sans text-[10px] leading-relaxed text-neutral-400">{clipDiegetic(chronicle.TENSION, 360)}</p>
      </div>

      {chronicle.foundations.trim() ? (
        <div>
          <p className="mb-1 text-[8px] uppercase tracking-widest text-neutral-600">Cimientos</p>
          <p className="font-sans text-[10px] leading-relaxed text-neutral-500">{clipDiegetic(chronicle.foundations, 500)}</p>
        </div>
      ) : null}
    </div>
  );
}
