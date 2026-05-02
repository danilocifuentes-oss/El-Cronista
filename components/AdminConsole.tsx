"use client";

import { motion, AnimatePresence } from "framer-motion";

type Props = {
  open: boolean;
  onToggle: () => void;
  inquisitionThreat: number;
  onThreat: (v: number) => void;
  command: string;
  onCommand: (v: string) => void;
  onEmitCommand: () => void;
  remoteSheetHint: string;
  onApplyRemoteAdjust: () => void;
};

export function AdminConsole({
  open,
  onToggle,
  inquisitionThreat,
  onThreat,
  command,
  onCommand,
  onEmitCommand,
  remoteSheetHint,
  onApplyRemoteAdjust,
}: Props) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="fixed bottom-6 left-6 z-40 rounded-none border border-[var(--blood)] bg-black px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--blood)] sharp-border-inner hover:bg-[var(--blood)]/15"
      >
        Consola MJ
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-labelledby="mj-title"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            className="fixed inset-y-24 left-6 z-50 flex max-h-[70vh] w-[min(100%,340px)] flex-col border border-[var(--blood)] bg-neutral-950/98 p-5 shadow-[0_0_40px_rgba(139,0,0,0.35)] sharp-border-inner"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 id="mj-title" className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-[var(--blood)]">
                Protocolo MJ
              </h2>
              <button type="button" className="text-neutral-500 hover:text-white" onClick={onToggle}>
                ✕
              </button>
            </div>

            <label className="mt-4 font-mono text-[10px] uppercase text-neutral-500">
              Amenaza Inquisitorial (0–5)
            </label>
            <input
              type="range"
              min={0}
              max={5}
              step={1}
              value={inquisitionThreat}
              onChange={(e) => onThreat(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--blood)]"
            />
            <p className="font-mono text-[10px] text-[var(--terminal)]">{inquisitionThreat} / 5</p>

            <label className="mt-6 font-mono text-[10px] uppercase text-neutral-500">
              Directiva / comando
            </label>
            <textarea
              value={command}
              onChange={(e) => onCommand(e.target.value)}
              rows={4}
              className="mt-2 w-full resize-none border border-neutral-700 bg-black/80 px-2 py-2 font-mono text-xs text-neutral-200 sharp-border-inner"
              placeholder="// empujar estado de mesa..."
            />

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onEmitCommand}
                className="border border-[var(--blood)] px-4 py-2 font-mono text-[10px] font-bold uppercase text-[var(--blood)] sharp-border-inner hover:bg-[var(--blood)]/15"
              >
                Emitir a log
              </button>
              <button
                type="button"
                onClick={onApplyRemoteAdjust}
                className="border border-neutral-700 px-4 py-2 font-mono text-[10px] uppercase text-neutral-300 sharp-border-inner hover:border-[var(--terminal)]"
              >
                Ajuste simulacro ficha
              </button>
            </div>

            <p className="mt-6 font-mono text-[9px] leading-relaxed text-neutral-600">{remoteSheetHint}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
