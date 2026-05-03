"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import {
  NARRATIVE_STRANDS,
  STRAND_ACCENT,
  STRAND_HELPLINE,
  STRAND_LABEL,
  STRAND_TAG,
  type NarrativeStrand,
} from "@/lib/narrativeStrands";
import type { NarrativeLogEntry } from "@/lib/narrativeTypes";

export type { NarrativeLogEntry as LogEntry } from "@/lib/narrativeTypes";

type Props = {
  logs: NarrativeLogEntry[];
  composer: string;
  onComposer: (v: string) => void;
  onSend: () => void;
  accent: string;
  processing?: boolean;
  /** Línea contextual (nombre · clan) bajo el título del canal. */
  identityHint?: string;
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
      className="nexo-stream-panel flex min-h-0 flex-1 flex-col border bg-black/25 shadow-[inset_0_1px_0_rgba(57,255,20,0.06)] lg:min-h-[320px]"
      style={{ borderColor: `${strandBorder}44` }}
      aria-busy={processing ? true : undefined}
    >
      <header
        className="shrink-0 space-y-2 border-b border-[#161616] px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.32em]"
        style={{ color: accent }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span>{"//_STREAM"}</span>
          {identityHint ? (
            <span className="max-w-[min(100%,22rem)] truncate text-[9px] normal-case tracking-normal text-neutral-500">
              {identityHint}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5 normal-case tracking-normal">
          {NARRATIVE_STRANDS.map((s) => {
            const on = s === activeStrand;
            return (
              <button
                key={s}
                type="button"
                title={STRAND_HELPLINE[s]}
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
        <div className="shrink-0 border-b border-[var(--terminal)]/15 bg-black/40 px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.35em] text-[var(--terminal)]/85">
          <span className="animate-pulse">PROCESANDO</span>
          <span className="ml-1 inline-block min-w-[0.6rem] animate-pulse">█</span>
        </div>
      ) : null}
      <div
        ref={scrollRef}
        className="min-h-[200px] flex-1 overflow-y-auto scroll-smooth space-y-3 px-4 py-3"
      >
        <AnimatePresence mode="popLayout">
          {logs.map((entry) => (
            <motion.article
              key={entry.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-[96%] font-mono text-[10px] leading-relaxed ${
                entry.role === "sistema"
                  ? "text-neutral-600"
                  : entry.role === "narrador"
                    ? entry.cronistaOut
                      ? "border-l border-[var(--terminal)]/25 pl-3"
                      : "border-l border-[#252525] pl-3 text-neutral-500"
                    : "text-neutral-400"
              }`}
            >
              {entry.role !== "sistema" ? (
                <>
                  <span className="mr-2 text-[8px] uppercase text-neutral-700">
                    {entry.role === "jugador" ? "//_IN" : "//_OUT"}
                  </span>
                  <span
                    className={
                      entry.role === "narrador" && entry.cronistaOut
                        ? "cronista-out-text whitespace-pre-wrap"
                        : "whitespace-pre-wrap"
                    }
                  >
                    {entry.text}
                  </span>
                </>
              ) : (
                <span className="whitespace-pre-wrap text-[var(--terminal)]/55">{entry.text}</span>
              )}
              <span className="mt-1 block font-mono text-[8px] text-neutral-700">
                @{new Date(entry.ts).toISOString().slice(11, 23)}
              </span>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
      <div className="shrink-0 border-t border-[#161616] bg-black/20 p-3">
        <textarea
          value={composer}
          onChange={(e) => onComposer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          placeholder={`Escena en «${STRAND_LABEL[activeStrand]}»… (Enter envía · Shift+Enter línea nueva)`}
          rows={3}
          className="w-full resize-none border border-[#161616] bg-black/50 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-neutral-300 placeholder:text-neutral-600 focus:border-[var(--terminal)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--terminal)]/15"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[8px] text-neutral-600">Canal cifrado · el narrador responde al texto que envíes</p>
          <motion.button
            type="button"
            whileHover={canSend ? { scale: 1.02 } : undefined}
            whileTap={canSend ? { scale: 0.98 } : undefined}
            onClick={onSend}
            disabled={!canSend}
            className="border px-5 py-2 font-mono text-[9px] uppercase tracking-[0.28em] transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
            style={{ borderColor: `${accent}55`, color: accent }}
          >
            ENVIAR
          </motion.button>
        </div>
      </div>
    </section>
  );
}
