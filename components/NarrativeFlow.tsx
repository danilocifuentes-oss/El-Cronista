"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { NarrativeLogEntry } from "@/lib/narrativeTypes";

export type { NarrativeLogEntry as LogEntry } from "@/lib/narrativeTypes";

type Props = {
  logs: NarrativeLogEntry[];
  composer: string;
  onComposer: (v: string) => void;
  onSend: () => void;
  accent: string;
  processing?: boolean;
};

export function NarrativeFlow({ logs, composer, onComposer, onSend, accent, processing }: Props) {
  return (
    <section className="flex min-h-0 flex-1 flex-col border border-[#161616] bg-black/25 lg:min-h-[320px]">
      <header className="shrink-0 border-b border-[#161616] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.32em]" style={{ color: accent }}>
        {"//_STREAM"}
      </header>
      {processing ? (
        <div className="shrink-0 border-b border-[var(--terminal)]/15 bg-black/40 px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.35em] text-[var(--terminal)]/85">
          <span className="animate-pulse">PROCESANDO</span>
          <span className="ml-1 inline-block min-w-[0.6rem] animate-pulse">█</span>
        </div>
      ) : null}
      <div className="min-h-[200px] flex-1 overflow-y-auto space-y-3 px-4 py-3">
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
      <div className="shrink-0 border-t border-[#161616] p-3">
        <textarea
          value={composer}
          onChange={(e) => onComposer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="//_INJECT..."
          rows={2}
          className="w-full resize-none border border-[#161616] bg-black/50 px-2 py-2 font-mono text-[10px] text-neutral-400 focus:border-[var(--terminal)]/35 focus:outline-none"
        />
        <div className="mt-2 flex justify-end">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSend}
            className="border px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.25em] opacity-90 hover:opacity-100"
            style={{ borderColor: `${accent}55`, color: accent }}
          >
            TX
          </motion.button>
        </div>
      </div>
    </section>
  );
}
