"use client";

/** Resumen vivo de contexto — lectura sólo texto diegético. */

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
        <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-neutral-600">
          Rumor fresco en esta esquina
        </p>
        <p className="text-neutral-300">
          {beat ? clip(beat, 520) : "Algo en la ciudad aún guarda lugar para cuando decidas mover tu sombra primero que el resto."}
        </p>
      </div>

      <dl className="grid gap-3 text-[11px] text-neutral-500 sm:grid-cols-2">
        <div>
          <dt className="uppercase tracking-[0.22em] text-neutral-600">Presión ciudadana contra lo oculto (σ)</dt>
          <dd className="mt-1 text-lg font-light tabular-nums text-neutral-200">{inquisitionThreat}</dd>
          <dd className="mt-1 text-[10px] leading-snug text-neutral-600">
            Antena práctica sobre cuántos ojos institucionales pueden estar enfocándose en quienes caminan sin máscara; sube cuando el barrio registra fugas imprudentes.
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-[0.22em] text-neutral-600">Espacio donde estás oyendo la ciudad</dt>
          <dd className="mt-1 text-neutral-300">
            {activeStrand === "principal"
              ? "El mapa común donde varias criaturas de noche cargan rumor compartido."
              : activeStrand === "paralela"
                ? "Versión cerrada sólo tras tu vista — otros no heredan estos detalles salvo cuando los citas."
                : STRAND_LABEL[activeStrand]}
          </dd>
          <dd className="mt-1 text-[10px] leading-snug text-neutral-600">
            {activeStrand === "vivo"
              ? "Reserva para lo que cargas vivido cara a cara; aquí apenas se registra hueco táctico."
              : activeStrand === "principal"
                ? "Cada golpe público tiene testigos cruzados; lo que hagas deja marca accesible antes del alba siguiente."
                : "Puedes llevar consecuencias personales antes de exponerlas al rumor general."}
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
