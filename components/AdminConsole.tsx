"use client";

import { motion, AnimatePresence } from "framer-motion";

type Props = {
  open: boolean;
  onToggle: () => void;
  isNarrator: boolean;
  onToggleNarrator: (v: boolean) => void;
  inquisitionThreat: number;
  onThreat: (v: number) => void;
  famineIntervalMinutes: number;
  onFamineChange: (minutes: number) => void;
  forcedDifficulty: number;
  onForcedDifficulty: (v: number) => void;
  command: string;
  onCommand: (v: string) => void;
  onEmitCommand: () => void;
  /** Pie de consola MJ; evitar rutas, proveedores o claves en este texto. */
  remoteSheetHint?: string;
  /** Demostración: incrementa Hambre en +1 (no sustituye al Reloj). */
  onStressHunger: () => void;
  onForcedFrenesy: () => void;
  onForcedRage: () => void;
};

export function AdminConsole({
  open,
  onToggle,
  isNarrator,
  onToggleNarrator,
  inquisitionThreat,
  onThreat,
  famineIntervalMinutes,
  onFamineChange,
  forcedDifficulty,
  onForcedDifficulty,
  command,
  onCommand,
  onEmitCommand,
  remoteSheetHint,
  onStressHunger,
  onForcedFrenesy,
  onForcedRage,
}: Props) {
  const panelForNarrator = (
    <>
      <label className="mt-4 font-mono text-[10px] uppercase text-neutral-500">
        Reloj · intervalo hambre Σ (min)
      </label>
      <input
        type="range"
        min={5}
        max={240}
        step={5}
        value={famineIntervalMinutes}
        onChange={(e) => onFamineChange(Number(e.target.value))}
        className="mt-2 w-full accent-[var(--blood)]"
      />
      <p className="font-mono text-[10px] text-[var(--terminal)]">
        Cada {famineIntervalMinutes} min → +Σh
      </p>

      <label className="mt-6 font-mono text-[10px] uppercase text-neutral-500">
        Tirada forzada · dificultad (DF)
      </label>
      <input
        type="number"
        min={0}
        max={10}
        value={forcedDifficulty}
        onChange={(e) => onForcedDifficulty(Number(e.target.value))}
        className="mt-2 w-full border border-neutral-700 bg-black/90 px-2 py-2 font-mono text-xs text-neutral-200 sharp-border-inner"
      />

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onForcedFrenesy}
          className="border border-neutral-700 px-2 py-2 font-mono text-[10px] font-bold uppercase text-[var(--blood)] hover:border-[var(--blood)] sharp-border-inner"
        >
          Frenesí
        </button>
        <button
          type="button"
          onClick={onForcedRage}
          className="border border-neutral-700 px-2 py-2 font-mono text-[10px] font-bold uppercase text-[var(--blood)] hover:border-[var(--blood)] sharp-border-inner"
        >
          Enardecimiento
        </button>
      </div>

      <button
        type="button"
        onClick={onStressHunger}
        className="mt-4 w-full border border-neutral-700 px-4 py-2 font-mono text-[10px] uppercase text-neutral-300 sharp-border-inner hover:border-[var(--blood)] hover:text-[var(--blood)]"
      >
        Simular +1 Σh
      </button>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="fixed bottom-6 left-6 z-40 rounded-none border border-[var(--blood)] bg-black px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--blood)] sharp-border-inner hover:bg-[var(--blood)]/15"
      >
        [Consola MJ]
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-labelledby="mj-title"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            className="fixed inset-y-24 left-6 z-50 flex max-h-[76vh] w-[min(100%,360px)] flex-col overflow-y-auto border border-[var(--blood)] bg-neutral-950/98 p-5 shadow-[0_0_40px_rgba(139,0,0,0.35)] sharp-border-inner techno-grid"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 id="mj-title" className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-[var(--blood)]">
                Consola narrador
              </h2>
              <button type="button" className="text-neutral-500 hover:text-white" onClick={onToggle}>
                ✕
              </button>
            </div>

            <label className="mt-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-neutral-400">
              <input type="checkbox" checked={isNarrator} onChange={(e) => onToggleNarrator(e.target.checked)} />
              Modo narrador (MJ)
            </label>

            <label className="mt-4 font-mono text-[10px] uppercase text-neutral-500">
              Amenaza Σ (0–5)
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

            {isNarrator ? (
              panelForNarrator
            ) : (
              <p className="mt-6 font-mono text-[10px] text-neutral-600">
                Modo narrador desactivado · sin acceso a reloj, tiradas forzadas ni instrucciones al canal.
              </p>
            )}

            <label className="mt-8 font-mono text-[10px] uppercase text-neutral-500">
              Instrucción al canal
            </label>
            <textarea
              value={command}
              onChange={(e) => onCommand(e.target.value)}
              rows={4}
              disabled={!isNarrator}
              className="mt-2 w-full resize-none border border-neutral-700 bg-black/80 px-2 py-2 font-mono text-xs text-neutral-200 sharp-border-inner disabled:opacity-40"
              placeholder="// texto que recibe el narrador en el canal…"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isNarrator) onEmitCommand();
                }}
                disabled={!isNarrator}
                className="border border-[var(--blood)] px-4 py-2 font-mono text-[10px] font-bold uppercase text-[var(--blood)] sharp-border-inner hover:bg-[var(--blood)]/15 disabled:opacity-35"
              >
                Enviar al canal
              </button>
            </div>

            <p className="mt-6 font-mono text-[9px] leading-relaxed text-neutral-600">
              {remoteSheetHint ??
                "//_ALMACÉN · ficha y bitácora en perfil local de este equipo. Nada del canal sale sin tu acción."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
