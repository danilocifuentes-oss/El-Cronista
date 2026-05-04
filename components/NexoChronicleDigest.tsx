"use client";

import type { ChronicleConfig } from "@/lib/chronicleConfig";
import type { SoloNexoDigest } from "@/lib/soloCampaign/soloDigestNexo";

type Props = {
  chronicle: ChronicleConfig;
  rollingSummary: string;
  pendingSynaptic: string;
  inquisitionThreat: number;
  /** Si hay campaña solitaria activa, la columna prioriza su eco sobre rumor genérico. */
  soloDigest?: SoloNexoDigest | null;
};

function clip(s: string, max: number) {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

export function NexoChronicleDigest({
  chronicle,
  rollingSummary,
  pendingSynaptic,
  inquisitionThreat,
  soloDigest,
}: Props) {
  if (soloDigest) {
    return (
      <div className="space-y-5 px-5 py-6 font-sans text-[13px] leading-relaxed tracking-[0.01em]">
        <div className="space-y-2 border-b border-white/[0.06] pb-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-neutral-500">Eco de la crónica activa</p>
          <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">{soloDigest.chapterTitle}</p>
          <p className="font-medium text-neutral-200">{soloDigest.sceneTitle}</p>
          {soloDigest.sceneLead ? (
            <p className="text-neutral-400">{soloDigest.sceneLead}</p>
          ) : null}
        </div>
        {soloDigest.echoLines.length ? (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.26em] text-neutral-600">Últimos movimientos</p>
            <ul className="space-y-2.5">
              {soloDigest.echoLines.map((line, i) => (
                <li
                  key={`${i}-${line.slice(0, 24)}`}
                  className="border-l border-[color:var(--terminal)]/35 pl-3 text-[12px] leading-snug text-neutral-400"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  const beat =
    rollingSummary.trim() ||
    chronicle.ESTADO_GLOBAL.trim() ||
    chronicle.TENSION.trim() ||
    chronicle.AMBIENTE.trim();

  return (
    <div className="space-y-6 px-5 py-6 font-sans text-[13px] leading-relaxed tracking-[0.01em]">
      <div className="space-y-1 border-b border-white/[0.06] pb-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-neutral-600">Ciudad esta noche</p>
        <p className="text-neutral-300">
          {beat
            ? clip(beat, 520)
            : "La calle sigue en silencio hasta que elijas dónde pisar primero."}
        </p>
      </div>

      <dl className="grid gap-4 text-[11px] text-neutral-500">
        <div>
          <dt className="uppercase tracking-[0.18em] text-neutral-600">Presión del Σ</dt>
          <dd className="mt-1 text-lg font-light tabular-nums text-neutral-200">{inquisitionThreat}</dd>
          <dd className="mt-1 text-[10px] leading-snug text-neutral-600">
            Cuánto calor institucional puede caer sobre quien se mueve sin careta.
          </dd>
        </div>
      </dl>

      {pendingSynaptic.trim() ? (
        <p className="border-l border-[color:var(--crimson)]/55 pl-4 text-[12px] text-neutral-400">{clip(pendingSynaptic, 400)}</p>
      ) : null}
    </div>
  );
}
