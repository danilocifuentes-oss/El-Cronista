"use client";

import type { NarrativeResetOptions } from "@/lib/narrativeMemory";
import { STRAND_LABEL, type NarrativeStrand } from "@/lib/narrativeStrands";

type Props = {
  ideasText: string;
  onIdeasChange: (next: string) => void;
  onResetChannel: (opts: NarrativeResetOptions) => void;
  activeStrand: NarrativeStrand;
};

export function NarrativeMemoryPanel({ ideasText, onIdeasChange, onResetChannel, activeStrand }: Props) {
  return (
    <details className="border border-[#161616] bg-black/35 font-mono text-[10px] text-neutral-500">
      <summary className="cursor-pointer px-3 py-2.5 text-[8px] uppercase tracking-[0.28em] text-neutral-600">
        Memoria e ideas · no es el canal
      </summary>
      <div className="border-t border-[#161616] px-3 py-3">
        <p className="text-[9px] leading-snug text-neutral-600">
          Se guardan con el perfil. «Solo hilo» vacía sólo «{STRAND_LABEL[activeStrand]}»; el archivo global conserva otros hilos.
        </p>
        <label htmlFor="ideas-repo" className="mt-2 block text-[8px] uppercase tracking-widest text-neutral-700">
          Continuidad
        </label>
        <textarea
          id="ideas-repo"
          rows={4}
          value={ideasText}
          onChange={(e) => onIdeasChange(e.target.value.slice(0, 12000))}
          placeholder="Arcos, líneas rojas para el Cronista…"
          className="mt-1 w-full resize-y border border-[#161616] bg-black/50 px-2 py-1.5 text-[10px] leading-relaxed text-neutral-400 placeholder:text-neutral-700 focus:border-neutral-600 focus:outline-none"
        />
        <div className="mt-3 space-y-2 border-t border-[#161616]/80 pt-3">
          <p className="text-[8px] uppercase tracking-widest text-neutral-700">Reinicio del canal</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              title={`Solo «${STRAND_LABEL[activeStrand]}» · otros hilos intactos`}
              className="border border-[#161616] px-2 py-1.5 text-[9px] uppercase tracking-widest text-neutral-400 hover:border-neutral-600 hover:text-neutral-300"
              onClick={() => onResetChannel({ strandOnly: activeStrand })}
            >
              Solo hilo
            </button>
            <button
              type="button"
              className="border border-[#161616] px-2 py-1.5 text-[9px] uppercase tracking-widest text-neutral-400 hover:border-neutral-600 hover:text-neutral-300"
              onClick={() => onResetChannel({})}
            >
              Log + resumen
            </button>
            <button
              type="button"
              className="border border-[#161616] px-2 py-1.5 text-[9px] uppercase tracking-widest text-neutral-400 hover:border-neutral-600 hover:text-neutral-300"
              onClick={() => onResetChannel({ clearMj: true })}
            >
              + MJ
            </button>
            <button
              type="button"
              className="border border-[#252525] px-2 py-1.5 text-[9px] uppercase tracking-widest text-[var(--blood)]/80 hover:border-[var(--blood)]/50"
              onClick={() => onResetChannel({ clearIdeas: true, clearMj: true })}
            >
              Todo
            </button>
          </div>
        </div>
      </div>
    </details>
  );
}
