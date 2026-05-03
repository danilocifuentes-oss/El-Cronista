"use client";

import { useCallback, useEffect, useState } from "react";
import type { MainQuestBeat, NexusWorldState, QuestPhase } from "@/lib/nexusWorldState";
import { loadNexusWorldState, saveNexusWorldState } from "@/lib/nexusWorldState";
import { STRAND_LABEL, type NarrativeStrand } from "@/lib/narrativeStrands";

type Props = {
  accent: string;
  worldRev: number;
  isNarrator: boolean;
};

const PHASES: QuestPhase[] = ["latente", "activa", "resuelta", "fallida"];
const STRANDS: Array<MainQuestBeat["strandHint"]> = ["cualquiera", "principal", "paralela", "vivo"];

function phaseLabel(p: QuestPhase): string {
  switch (p) {
    case "latente":
      return "Latente";
    case "activa":
      return "Activa";
    case "resuelta":
      return "Resuelta";
    case "fallida":
      return "Fallida";
    default:
      return p;
  }
}

export function NexoWorldMissions({ accent, worldRev, isNarrator }: Props) {
  const [state, setState] = useState<NexusWorldState>(() => loadNexusWorldState());
  const [eraDraft, setEraDraft] = useState("");
  const [flagsDraft, setFlagsDraft] = useState("");

  useEffect(() => {
    const s = loadNexusWorldState();
    setState(s);
    setEraDraft(s.eraLabel);
    setFlagsDraft(s.worldFlags.join("\n"));
  }, [worldRev]);

  const persist = useCallback((next: NexusWorldState) => {
    saveNexusWorldState(next);
    setState(loadNexusWorldState());
  }, []);

  const patchQuest = (id: string, patch: Partial<MainQuestBeat>) => {
    if (!isNarrator) return;
    const cur = loadNexusWorldState();
    persist({
      ...cur,
      mainQuestLine: cur.mainQuestLine.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    });
  };

  const saveMetaFields = () => {
    if (!isNarrator) return;
    const cur = loadNexusWorldState();
    const flags = flagsDraft
      .split(/[\n,]/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 22);
    persist({
      ...cur,
      eraLabel: eraDraft.trim().slice(0, 280) || cur.eraLabel,
      worldFlags: flags,
    });
  };

  const addQuest = () => {
    if (!isNarrator) return;
    const cur = loadNexusWorldState();
    const id = `mq-${Date.now().toString(36)}`;
    const q: MainQuestBeat = {
      id,
      title: "Nueva misión",
      briefing: "Describe qué debe perseguir el motor.",
      phase: "latente",
      strandHint: "cualquiera",
    };
    persist({ ...cur, mainQuestLine: [...cur.mainQuestLine, q] });
  };

  const removeQuest = (id: string) => {
    if (!isNarrator) return;
    const cur = loadNexusWorldState();
    persist({ ...cur, mainQuestLine: cur.mainQuestLine.filter((q) => q.id !== id) });
  };

  const visible = [...state.mainQuestLine].slice(0, 8);

  return (
    <div className="border-t border-[#222] bg-black/45 font-mono text-[9px] text-neutral-500">
      <header
        className="flex items-center justify-between gap-2 border-b border-[#222] px-3 py-2 uppercase tracking-[0.22em]"
        style={{ color: accent }}
      >
        <span>Mundo · misiones</span>
      </header>
      <div className="space-y-3 px-3 py-3">
        <p className="text-[9px] leading-snug text-neutral-600">
          El Cronista usa esto junto al resumen del canal para no repetir siempre una misma “primera noche” y para separar{' '}
          <span className="text-neutral-500">{STRAND_LABEL.principal}</span> vs{' '}
          <span className="text-neutral-500">{STRAND_LABEL.paralela}</span>.
        </p>

        <div className="rounded-md border border-[#2a2a30] bg-black/50 p-2">
          <p className="text-[8px] uppercase tracking-[0.2em] text-neutral-700">Era declarada</p>
          <p className="mt-1 font-sans text-[10px] leading-snug text-neutral-400">{state.eraLabel}</p>
          {state.lastBeat ? (
            <>
              <p className="mt-2 text-[8px] uppercase tracking-[0.2em] text-neutral-700">Últimos ecos mundiales</p>
              <p className="mt-1 font-sans text-[10px] leading-relaxed text-neutral-500">{state.lastBeat.slice(0, 420)}{state.lastBeat.length > 420 ? "…" : ""}</p>
            </>
          ) : (
            <p className="mt-2 italic text-neutral-700">Sin ecos aún — avanzan con cada resumen del narrador.</p>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-[8px] uppercase tracking-[0.24em] text-neutral-700">Línea principal</p>
          <ul className="space-y-2">
            {visible.map((q) => (
              <li key={q.id} className="rounded border border-[#26262e] bg-black/40 p-2">
                <div className="flex flex-wrap items-start justify-between gap-1">
                  {isNarrator ? (
                    <input
                      value={q.title}
                      onChange={(e) => patchQuest(q.id, { title: e.target.value.slice(0, 120) })}
                      className="min-w-[8rem] flex-1 border border-[#333] bg-black/55 px-1 py-0.5 font-sans text-[10px] text-neutral-200"
                    />
                  ) : (
                    <span className="font-sans text-[10px] font-medium text-neutral-300">{q.title}</span>
                  )}
                  <span className="text-[8px] text-neutral-600">
                    {q.strandHint === "cualquiera" ? "Cualquier hilo" : STRAND_LABEL[q.strandHint as NarrativeStrand]}
                  </span>
                </div>
                {isNarrator ? (
                  <textarea
                    value={q.briefing}
                    onChange={(e) => patchQuest(q.id, { briefing: e.target.value.slice(0, 800) })}
                    rows={2}
                    className="mt-1 w-full resize-y border border-[#333] bg-black/55 px-1.5 py-1 font-sans text-[9px] leading-snug text-neutral-400"
                  />
                ) : (
                  <p className="mt-1 font-sans text-[9px] leading-snug text-neutral-500">{q.briefing}</p>
                )}
                {isNarrator ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1 text-[8px] text-neutral-600">
                      Fase
                      <select
                        value={q.phase}
                        onChange={(e) => patchQuest(q.id, { phase: e.target.value as QuestPhase })}
                        className="border border-[#333] bg-black px-1 py-0.5 text-[9px] text-neutral-300"
                      >
                        {PHASES.map((p) => (
                          <option key={p} value={p}>
                            {phaseLabel(p)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-center gap-1 text-[8px] text-neutral-600">
                      Hilo
                      <select
                        value={q.strandHint}
                        onChange={(e) =>
                          patchQuest(q.id, { strandHint: e.target.value as MainQuestBeat["strandHint"] })
                        }
                        className="border border-[#333] bg-black px-1 py-0.5 text-[9px] text-neutral-300"
                      >
                        {STRANDS.map((s) => (
                          <option key={s} value={s}>
                            {s === "cualquiera" ? "Cualquiera" : STRAND_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeQuest(q.id)}
                      className="ml-auto text-[8px] uppercase tracking-wider text-[var(--blood)]/80 hover:text-[var(--blood)]"
                    >
                      Quitar
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          {isNarrator ? (
            <button
              type="button"
              onClick={addQuest}
              className="mt-2 w-full border border-[#2f2f36] py-1.5 text-[8px] uppercase tracking-[0.2em] text-neutral-500 hover:border-neutral-600 hover:text-neutral-400"
            >
              + Misión / arco
            </button>
          ) : null}
        </div>

        {isNarrator ? (
          <details className="rounded border border-[#2a2a30] bg-black/35">
            <summary className="cursor-pointer px-2 py-1.5 text-[8px] uppercase tracking-[0.22em] text-neutral-600">
              Editar era y marcadores
            </summary>
            <div className="space-y-2 border-t border-[#222] px-2 py-2">
              <label className="block text-[8px] uppercase tracking-wider text-neutral-700">Era (línea corta)</label>
              <input
                value={eraDraft}
                onChange={(e) => setEraDraft(e.target.value.slice(0, 300))}
                className="w-full border border-[#333] bg-black/60 px-2 py-1 font-sans text-[10px] text-neutral-300"
              />
              <label className="block text-[8px] uppercase tracking-wider text-neutral-700">
                Marcadores (uno por línea o separados por coma)
              </label>
              <textarea
                value={flagsDraft}
                onChange={(e) => setFlagsDraft(e.target.value.slice(0, 2000))}
                rows={3}
                className="w-full resize-y border border-[#333] bg-black/60 px-2 py-1 font-mono text-[9px] text-neutral-400"
              />
              <button
                type="button"
                onClick={() => saveMetaFields()}
                className="border border-[color:var(--terminal)]/40 px-3 py-1 text-[8px] uppercase tracking-widest text-[var(--terminal)] hover:bg-[var(--terminal)]/10"
              >
                Guardar
              </button>
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}
