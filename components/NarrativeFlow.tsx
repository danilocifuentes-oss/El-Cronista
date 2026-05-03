"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import {
  NARRATIVE_STRANDS,
  STRAND_ACCENT,
  STRAND_LABEL,
  STRAND_TAG,
  type NarrativeStrand,
} from "@/lib/narrativeStrands";
import type { NarrativeLogEntry } from "@/lib/narrativeTypes";

function scrollToManifestZone(): void {
  if (typeof document === "undefined") return;
  document.querySelector("[data-manifest-zone]")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

export type { NarrativeLogEntry as LogEntry } from "@/lib/narrativeTypes";

/** Atajos diegéticos: no sustituyen al Cronista; rellenan el campo para seguir la escena. */
const QUICK_SCENE_OPENERS: { label: string; text: string }[] = [
  { label: "Observar", text: "Observo el entorno sin llamar la atención." },
  { label: "Acechar", text: "Acecho antes de moverme; busco rutas y anomalías." },
  { label: "Intervenir", text: "Tomo la palabra con intención clara." },
  { label: "Retirarme", text: "Priorizo cortar exposición antes de que empeore." },
];

function mergeComposerLine(current: string, addition: string): string {
  const t = current.trim();
  return t ? `${t}\n\n${addition}` : addition;
}

type Props = {
  logs: NarrativeLogEntry[];
  composer: string;
  onComposer: (v: string) => void;
  onSend: () => void;
  accent: string;
  processing?: boolean;
  /** Línea contextual (nombre · clan) bajo el título del canal. */
  identityHint?: string;
  /** Etiquetas //_IN y marcas temporales — solo útiles para MJ. */
  showTechnicalAnchors?: boolean;
  /** Rellena el compositor con texto de una sugerencia del narrador. */
  onPickSuggestion?: (text: string) => void;
  activeStrand: NarrativeStrand;
  onStrandChange: (s: NarrativeStrand) => void;
};

export function NarrativeFlow({
  logs,
  composer,
  onComposer,
  onSend,
  accent,
  processing,
  identityHint,
  showTechnicalAnchors = false,
  onPickSuggestion,
  activeStrand,
  onStrandChange,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [logs]);

  const canSend = composer.trim().length > 0 && !processing;
  const strandBorder = STRAND_ACCENT[activeStrand];

  return (
    <section
      className="nexo-stream-panel nexo-gothic-shell flex min-h-0 flex-1 flex-col overflow-hidden border border-[#2a2a30]/80 bg-black/25 shadow-[inset_0_1px_0_rgba(192,38,211,0.06)]"
      style={{ borderColor: `${strandBorder}55` }}
      aria-busy={processing ? true : undefined}
    >
      <header
        className="shrink-0 space-y-2 border-b border-[#222] px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.32em]"
        style={{ color: accent }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          {showTechnicalAnchors ? (
            <span className="gothic-title text-[10px] font-medium normal-case tracking-tight text-neutral-400">
              //_STREAM · CRÓNICA
            </span>
          ) : identityHint ? (
            <span className="max-w-[min(100%,28rem)] truncate font-sans text-[11px] font-normal normal-case tracking-tight text-neutral-400">
              {identityHint}
            </span>
          ) : (
            <span className="sr-only">Escena activa</span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 normal-case tracking-normal">
          {NARRATIVE_STRANDS.map((s) => {
            const on = s === activeStrand;
            return (
              <button
                key={s}
                type="button"
                title={undefined}
                aria-label={STRAND_LABEL[s]}
                onClick={() => onStrandChange(s)}
                className={`rounded border px-2 py-1 text-[8px] font-mono transition-colors ${
                  on ? "text-neutral-100" : "border-[#2a2a2a] text-neutral-500 hover:border-neutral-600 hover:text-neutral-300"
                }`}
                style={
                  on
                    ? {
                        borderColor: STRAND_ACCENT[s],
                        backgroundColor: `${STRAND_ACCENT[s]}18`,
                        color: STRAND_ACCENT[s],
                      }
                    : undefined
                }
              >
                <span className="opacity-80">{STRAND_TAG[s]}</span> {STRAND_LABEL[s]}
              </button>
            );
          })}
        </div>
      </header>
      {processing ? (
        showTechnicalAnchors ? (
          <div className="shrink-0 border-b border-[var(--neon)]/20 bg-black/50 px-4 py-2 font-mono text-[9px] tracking-[0.2em] text-[color:var(--neon)]">
            <span className="animate-pulse uppercase tracking-[0.35em]">PROCESANDO</span>
            <span className="ml-2 inline-block min-w-[0.6rem] animate-pulse">█</span>
            <span className="mt-1 block normal-case tracking-normal text-[8px] text-neutral-500">Procesando respuesta…</span>
          </div>
        ) : (
          <div className="shrink-0 border-b border-[#2a2a30]/90 bg-black/35 px-4 py-3 font-sans text-[13px] leading-snug tracking-wide text-neutral-400">
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--neon)] shadow-[0_0_10px_var(--neon)]" />
              Un momento…
            </span>
          </div>
        )
      ) : null}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto scroll-smooth space-y-3 px-4 py-3"
      >
        <AnimatePresence mode="popLayout">
          {logs.map((entry) => (
            <motion.article
              key={entry.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={
                entry.role === "sistema"
                  ? "max-w-[96%] font-mono text-[10px] leading-relaxed text-neutral-600"
                  : showTechnicalAnchors
                    ? `max-w-[96%] font-mono text-[10px] leading-relaxed ${
                        entry.role === "narrador"
                          ? entry.cronistaOut
                            ? "border-l border-[var(--terminal)]/25 pl-3 text-neutral-300"
                            : "border-l border-[#252525] pl-3 text-neutral-500"
                          : "border-l border-[#252525] pl-3 text-neutral-400"
                      }`
                    : `max-w-[min(48rem,96%)] font-sans text-[13px] leading-[1.72] tracking-[0.02em] ${
                        entry.role === "narrador"
                          ? entry.cronistaOut
                            ? "border-l-2 border-[var(--terminal)]/30 pl-4 text-neutral-200"
                            : "border-l border-[#2a2a30] pl-4 text-neutral-400"
                          : "border-l border-[#2a2a30] pl-4 text-neutral-300"
                      }`
              }
            >
              {entry.role !== "sistema" ? (
                <>
                  {showTechnicalAnchors ? (
                    <span className="mr-2 text-[8px] uppercase text-neutral-700">
                      {entry.role === "jugador" ? "//_IN" : "//_OUT"}
                    </span>
                  ) : null}
                  <span
                    className={
                      entry.role === "narrador" && entry.cronistaOut
                        ? "cronista-out-text whitespace-pre-wrap"
                        : "whitespace-pre-wrap"
                    }
                  >
                    {entry.text}
                  </span>
                  {entry.role === "narrador" && !entry.cronistaOut && entry.suggestions?.length ? (
                    <div className="mt-3 space-y-1.5 border-t border-white/[0.04] pt-3">
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-600">
                        Siguiente movimiento plausible
                      </p>
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
                        {entry.suggestions.map((s, i) => (
                          <button
                            key={`${entry.id}-sug-${i}`}
                            type="button"
                            onClick={() => onPickSuggestion?.(s)}
                            className={`max-w-full rounded-lg border border-white/[0.08] bg-black/45 px-2.5 py-2 text-left font-sans text-neutral-200 transition hover:border-white/15 hover:bg-black/60 ${showTechnicalAnchors ? "text-[9px] leading-snug" : "text-[12px] leading-snug tracking-[0.02em]"}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {entry.role === "narrador" && entry.rollPrompt ? (
                    <aside
                      className={`mt-3 rounded-xl border px-3 py-2.5 font-sans ${
                        entry.rollPrompt.nivel === "urgente"
                          ? "border-[color:var(--blood)]/35 bg-[color:var(--blood)]/[0.07]"
                          : entry.rollPrompt.nivel === "recomendada"
                            ? "border-amber-900/35 bg-amber-950/20"
                            : "border-white/[0.06] bg-black/40"
                      }`}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                        {entry.rollPrompt.nivel === "urgente"
                          ? "La escena pide tirada"
                          : entry.rollPrompt.nivel === "recomendada"
                            ? "Sería mejor con tirada"
                            : "Podés apoyarte con tirada"}
                      </p>
                      <p className="mt-1 text-[12px] leading-snug text-neutral-400">{entry.rollPrompt.enfoque}</p>
                      <button
                        type="button"
                        onClick={() => scrollToManifestZone()}
                        className="mt-2 text-left text-[11px] underline decoration-neutral-700 underline-offset-[3px] transition hover:text-neutral-200 hover:decoration-neutral-500"
                        style={{ color: accent }}
                      >
                        Ir a Voluntad y armar pool con tu CODEX
                      </button>
                    </aside>
                  ) : null}
                </>
              ) : (
                <span className="whitespace-pre-wrap text-[var(--terminal)]/55">{entry.text}</span>
              )}
              {showTechnicalAnchors ? (
                <span className="mt-1 block font-mono text-[8px] text-neutral-700">
                  @{new Date(entry.ts).toISOString().slice(11, 23)}
                </span>
              ) : null}
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
      <div className="shrink-0 border-t border-[#1c1c22] bg-black/35 p-3 sm:p-4">
        {!showTechnicalAnchors && !processing ? (
          <details className="mb-2 rounded-md border border-[#2a2a30]/80 bg-black/30">
            <summary className="cursor-pointer px-2.5 py-1.5 font-sans text-[10px] tracking-wide text-neutral-600">
              Atajos (+)
            </summary>
            <div className="flex flex-wrap gap-1.5 border-t border-[#252525]/80 px-2 py-2">
              {QUICK_SCENE_OPENERS.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  title={q.text}
                  onClick={() => onComposer(mergeComposerLine(composer, q.text))}
                  className="rounded border border-[#34343c] bg-black/50 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-neutral-400 transition hover:border-neutral-600 hover:text-neutral-200"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </details>
        ) : null}
        <textarea
          value={composer}
          onChange={(e) => onComposer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          placeholder={
            showTechnicalAnchors
              ? `Escena · ${STRAND_TAG[activeStrand]} (Enter envía · Shift+Enter nueva línea)`
              : "Describe qué haces, qué dices o hacia dónde te mueves."
          }
          rows={showTechnicalAnchors ? 3 : 4}
          className={`w-full resize-y border border-[#26262e] bg-black/55 px-3 py-2.5 placeholder:text-neutral-600 focus:border-[var(--terminal)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--terminal)]/12 ${showTechnicalAnchors ? "font-mono text-[11px] leading-relaxed text-neutral-300" : "font-sans text-[13px] leading-relaxed tracking-[0.02em] text-neutral-200"}`}
        />
        <div className="mt-2.5 flex flex-wrap items-end justify-between gap-3 border-t border-[#252525]/60 pt-2.5">
          <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-neutral-600">
            {showTechnicalAnchors ? "ENTER envía · shift+enter nueva línea" : "ENTER envía"}
          </p>
          <motion.button
            type="button"
            whileHover={canSend ? { scale: 1.02 } : undefined}
            whileTap={canSend ? { scale: 0.98 } : undefined}
            onClick={onSend}
            disabled={!canSend}
            className="shrink-0 border px-6 py-2 font-mono text-[9px] uppercase tracking-[0.28em] transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
            style={{ borderColor: `${accent}55`, color: accent }}
          >
            ENVIAR
          </motion.button>
        </div>
      </div>
    </section>
  );
}
