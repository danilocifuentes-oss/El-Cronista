"use client";

import { motion, AnimatePresence } from "framer-motion";

export type LogEntry = {
  id: string;
  role: "narrador" | "jugador" | "sistema";
  text: string;
  ts: number;
};

type Props = {
  logs: LogEntry[];
  composer: string;
  onComposer: (v: string) => void;
  onSend: () => void;
  accent: string;
};

export function NarrativeFlow({ logs, composer, onComposer, onSend, accent }: Props) {
  return (
    <section className="flex min-h-0 flex-1 flex-col sharp-border-inner border-neutral-800 bg-neutral-950/70">
      <header
        className="shrink-0 border-b border-neutral-800 px-5 py-3 font-mono text-xs uppercase tracking-[0.35em]"
        style={{ color: accent }}
      >
        El flujo narrativo — canal seguro SchreckNet
      </header>
      <div className="min-h-[320px] flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {logs.map((entry) => (
            <motion.article
              key={entry.id}
              layout
              initial={{ opacity: 0, x: entry.role === "narrador" ? -8 : 8 }}
              animate={{ opacity: 1, x: 0 }}
              className={`max-w-[95%] text-sm leading-relaxed ${
                entry.role === "narrador"
                  ? "narrador-bubble italic"
                  : entry.role === "sistema"
                    ? "border border-neutral-800 bg-black/70 px-3 py-2 font-mono text-xs text-neutral-500"
                    : "border px-4 py-3 font-sans text-neutral-200"
              }`}
              style={
                entry.role === "jugador"
                  ? { borderColor: `${accent}66`, boxShadow: `inset 0 0 0 1px ${accent}22` }
                  : undefined
              }
            >
              {entry.role === "narrador" && (
                <span className="mb-1 block font-mono text-[10px] not-italic uppercase tracking-[0.3em] text-[var(--terminal)]/70">
                  Narrador / Cronista
                </span>
              )}
              <p className="whitespace-pre-wrap">{entry.text}</p>
              <span className="mt-2 block font-mono text-[9px] text-neutral-600">
                {new Date(entry.ts).toLocaleTimeString("es")}
              </span>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
      <div className="shrink-0 border-t border-neutral-800 p-4">
        <textarea
          value={composer}
          onChange={(e) => onComposer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Declarar acción al Cronista..."
          rows={3}
          className="w-full resize-none border border-neutral-700 bg-black/80 px-3 py-2 font-sans text-sm text-neutral-200 sharp-border-inner focus:border-[var(--terminal)] focus:outline-none"
        />
        <div className="mt-2 flex justify-end">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSend}
            className="border px-6 py-2 font-mono text-xs font-bold uppercase tracking-[0.2em] sharp-border-inner"
            style={{
              borderColor: accent,
              color: accent,
              boxShadow: `inset 0 0 16px ${accent}22`,
            }}
          >
            Transmitir
          </motion.button>
        </div>
      </div>
    </section>
  );
}
