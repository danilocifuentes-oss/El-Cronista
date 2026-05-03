"use client";

/** Resumen vivo del Nexo — solo lectura, sin jargon de backstage. */

import type { ChronicleConfig } from "@/lib/chronicleConfig";
import type { NarrativeStrand } from "@/lib/narrativeStrands";
import { STRAND_LABEL } from "@/lib/narrativeStrands";

type Props = {
  chronicle: ChronicleConfig;
  activeStrand: NarrativeStrand;
  rollingSummary: string;
  pendingSynaptic: string;
  inquisitionThreat: number;
};

function clip(s: string, max: number) {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

export function NexoChronicleDigest({
  chronicle,
  activeStrand,
  rollingSummary,
  pendingSynaptic,
  inquisitionThreat,
}: Props) {
  const beat =
    rollingSummary.trim() ||
    chronicle.ESTADO_GLOBAL.trim() ||
    chronicle.TENSION.trim() ||
    chronicle.AMBIENTE.trim();

  return (
    <div className="space-y-6 px-5 py-6 font-sans text-[13px] leading-relaxed tracking-[0.01em]">
      <div className="space-y-1 border-b border-white/[0.06] pb-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-neutral-600">Eco reciente</p>
        <p className="text-neutral-300">{beat ? clip(beat, 520) : "La ciudad espera tu próximo movimiento."}</p>
      </div>

      <dl className="grid gap-3 text-[11px] text-neutral-500 sm:grid-cols-2">
        <div>
          <dt className="uppercase tracking-[0.22em] text-neutral-600">Índice σ</dt>
          <dd className="mt-1 text-lg font-light tabular-nums text-neutral-200">{inquisitionThreat}</dd>
          <dd className="mt-1 text-[10px] leading-snug text-neutral-600">
            Presión observable de la segunda inquisición; sube cuando el entorno sospecha o fuerzas muestras a la Luz.
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-[0.22em] text-neutral-600">Ritmo activo</dt>
          <dd className="mt-1 text-neutral-300">{STRAND_LABEL[activeStrand]}</dd>
          <dd className="mt-1 text-[10px] leading-snug text-neutral-600">
            {activeStrand === "principal"
              ? "Todos comparten esta crónica."
              : activeStrand === "paralela"
                ? "Solo tu personaje lleva estas escenas sin doblegar lo común."
                : "Sin uso en Nexo por ahora."}
          </dd>
        </div>
      </dl>

      {pendingSynaptic.trim() ? (
        <p className="border-l border-[color:var(--crimson)]/55 pl-4 text-[12px] text-neutral-400">
          {clip(pendingSynaptic, 400)}
        </p>
      ) : null}
    </div>
  );
}
