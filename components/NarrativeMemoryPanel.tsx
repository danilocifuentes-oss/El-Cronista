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
    <div className="border-t border-[#161616] bg-black/35 p-3 font-mono text-[10px] text-neutral-500">
      <p className="text-[8px] uppercase tracking-[0.35em] text-neutral-700">{"//_MEMORIA_NARRATIVA"}</p>
      <p className="mt-1 text-[9px] leading-snug text-neutral-600">
        Ideas por CV (se guardan con el perfil activo al cambiar de personaje o al cerrar sesión desde REGISTRO CV). No es el log del canal.
      </p>
      <label htmlFor="ideas-repo" className="mt-2 block text-[8px] uppercase tracking-widest text-neutral-700">
        Ideas / continuidad
      </label>
      <textarea
        id="ideas-repo"
        rows={5}
        value={ideasText}
        onChange={(e) => onIdeasChange(e.target.value.slice(0, 12000))}
        placeholder="Arcos, NPC recurrentes, tablas que la IA debe respetar…"
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
  );
}
