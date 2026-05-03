"use client";

import { TechnicalHud } from "./TechnicalHud";

type Props = {
  accent: string;
  healthFilled: number;
  healthMax: number;
  hunger: number;
  /** Cambiar avatar activo — registro Cainita */
  onEidolonVault: () => void;
  onCodex: () => void;
  onLogout: () => void;
};

/**
 * Nave lateral mínima: Codex, registro vampírico, salida — sin ruído institucional.
 */
export function SidebarMesa({
  accent,
  healthFilled,
  healthMax,
  hunger,
  onEidolonVault,
  onCodex,
  onLogout,
}: Props) {
  return (
    <aside
      className="sticky top-0 hidden min-h-0 w-[11.5rem] shrink-0 flex-col gap-5 self-stretch overflow-y-auto border-r border-[#27272f] bg-[linear-gradient(180deg,rgba(0,0,0,0.5),rgba(14,14,18,0.92))] px-3.5 py-5 xl:flex xl:max-h-none"
      aria-label="Codex V"
    >
      <div className="space-y-1 border-b border-white/[0.06] pb-4">
        <p className="font-sans text-[13px] font-light tracking-[0.28em] text-neutral-200">Codex V</p>
        <p className="text-[9px] font-normal leading-snug tracking-wide text-neutral-600">
          Estado somático abierto sólo ante ti.
        </p>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-black/40 p-2.5" style={{ boxShadow: `${accent}09 0 0 0 1px inset` }}>
        <TechnicalHud
          healthFilled={healthFilled}
          healthMax={healthMax}
          hunger={hunger}
          compactLabels
          className="!flex-col !items-stretch gap-3 sm:!flex-col sm:!items-stretch"
        />
      </div>

      <nav className="flex flex-col gap-2 pt-1">
        <button
          type="button"
          onClick={onCodex}
          className="rounded-lg border border-zinc-800/90 bg-black/50 px-2.5 py-2.5 text-left font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-300 transition hover:border-[color:var(--neon)]/35 hover:text-white"
          style={{ borderColor: `${accent}2a` }}
        >
          Hoja CODEX
        </button>
        <button
          type="button"
          onClick={onEidolonVault}
          className="rounded-lg border border-zinc-800 bg-black/40 px-2.5 py-2.5 text-left font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400 transition hover:border-[color:var(--blood)]/25 hover:text-neutral-100"
          title="Elegir otra lápida entre tus envolturas"
        >
          Cripta del Elíseo
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="mt-2 rounded-lg border border-[var(--blood)]/30 px-2.5 py-2 text-left font-sans text-[9px] font-medium uppercase tracking-[0.2em] text-[var(--blood)] transition hover:bg-[var(--blood)]/10"
        >
          Salir del Nexo
        </button>
      </nav>
    </aside>
  );
}
