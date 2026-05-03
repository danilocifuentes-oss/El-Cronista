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
 * Riel derecho con orden diegético: primero urgencias de mesa; Génesis detallado colapsado.
 */
export function NexoChronicaRail({
  chronicle,
  activeStrand,
  inquisitionThreat,
  rollingSummary,
  pendingSynaptic,
}: Props) {
  const ciudadLine =
    clipDiegetic(chronicle.ESTADO_GLOBAL, 280) ||
    clipDiegetic(chronicle.TENSION, 260) ||
    clipDiegetic(chronicle.AMBIENTE, 260);

  return (
    <div className="space-y-4 font-mono text-[9px] text-neutral-500">
      <div>
        <h3 className="gothic-title mb-2 text-[9px] uppercase tracking-[0.32em] text-neutral-400">
          Estado de situación (orden de urgencia)
        </h3>
        <ol className="list-decimal space-y-3 pl-4 font-sans text-[10px] leading-relaxed text-neutral-300">
          <li>
            <span className="text-[8px] uppercase tracking-[0.2em] text-neutral-500">
              Vigilancia inquisitorial
            </span>
            <span className="mt-1 block text-neutral-200">Índice σ = {inquisitionThreat}</span>
            <span className="mt-0.5 block text-neutral-600">
              Elevado ⇒ más drones, filtros ciudadanos y cazadores oportunistas.
            </span>
          </li>

          <li>
            <span className="text-[8px] uppercase tracking-[0.2em] text-neutral-500">
              Canal del Nexo abierto en
            </span>
            <span className="mt-1 block text-[color:var(--neon)]">{STRAND_LABEL[activeStrand]}</span>
            <span className="mt-0.5 block text-neutral-600">
              Lo que ves en el centro es sólo este hilo. Otros hilos conservan archivo aparte hasta que cambies pestaña.
            </span>
          </li>

          {pendingSynaptic.trim() ? (
            <li className="text-[color:var(--crimson)]">
              <span className="text-[8px] uppercase tracking-[0.28em]">Intervención del operador</span>
              <p className="mt-1 whitespace-pre-wrap normal-case">{clipDiegetic(pendingSynaptic, 420)}</p>
            </li>
          ) : null}

          <li>
            <span className="text-[8px] uppercase tracking-[0.22em] text-neutral-500">
              Pulso ciudadano vigente
            </span>
            <p className="mt-1 normal-case">{ciudadLine || "Sin Estado global cargado — edita Génesis o deja fluir rumor callejero libremente."}</p>
          </li>

          <li>
            <span className="text-[8px] uppercase tracking-[0.22em] text-neutral-500">
              Rumor establecido (resumen técnico)
            </span>
            {rollingSummary.trim() ? (
              <p className="mt-1 whitespace-pre-wrap normal-case text-neutral-400">{clipDiegetic(rollingSummary, 720)}</p>
            ) : (
              <p className="mt-1 italic normal-case text-neutral-600">Este hilo aún no registra rumor compacto anterior.</p>
            )}
          </li>
        </ol>
      </div>

      <details className="rounded-xl border border-[#323238]/85 bg-black/35 open:border-[color:var(--neon)]/20">
        <summary className="cursor-pointer px-3 py-2 text-[8px] uppercase tracking-[0.28em] text-neutral-500">
          Expandir atmósfera narrativa · Génesis
        </summary>
        <div className="space-y-3 border-t border-[#2a2a30] px-3 py-3 font-sans text-[10px] leading-relaxed text-neutral-400">
          <p>
            <span className="text-[8px] uppercase tracking-[0.2em] text-neutral-600">Ambiente · </span>
            {clipDiegetic(chronicle.AMBIENTE, 360)}
          </p>
          <p>
            <span className="text-[8px] uppercase tracking-[0.2em] text-neutral-600">Tensión · </span>
            {clipDiegetic(chronicle.TENSION, 360)}
          </p>
          {chronicle.foundations.trim() ? (
            <p className="text-neutral-500">
              <span className="text-[8px] uppercase tracking-[0.2em] text-neutral-600">Cimientos · </span>
              {clipDiegetic(chronicle.foundations, 480)}
            </p>
          ) : null}
        </div>
      </details>
    </div>
  );
}
