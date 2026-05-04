"use client";

type Props = {
  onGoSolo: () => void;
  onGoHub: () => void;
};

export function NexoComingSoon({ onGoSolo, onGoHub }: Props) {
  return (
    <div className="min-h-screen bg-[#050505] px-4 py-10 font-mono text-neutral-300">
      <div className="mx-auto w-full max-w-2xl space-y-6 border border-[#1a1a1a] bg-black/45 p-6 sharp-border-inner">
        <p className="text-[10px] uppercase tracking-[0.34em] text-[var(--blood)]">Nexo · canal cooperativo</p>
        <h1 className="font-sans text-2xl font-semibold text-neutral-100">Próximamente</h1>
        <p className="text-sm leading-relaxed text-neutral-400">
          El modo cooperativo del Nexo queda en mantenimiento narrativo mientras cerramos la nueva arquitectura. Puedes jugar
          ahora mismo en Campaña Solitaria con progresión por personaje y decisiones por hoja CODEX.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={onGoSolo}
            className="border border-[var(--terminal)]/40 bg-neutral-950/80 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-[var(--terminal)] sharp-border-inner hover:bg-[var(--terminal)]/10"
          >
            Ir a Campaña Solitaria
          </button>
          <button
            type="button"
            onClick={onGoHub}
            className="border border-neutral-700 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-neutral-300 hover:border-neutral-500"
          >
            Volver al Hub
          </button>
        </div>
      </div>
    </div>
  );
}
