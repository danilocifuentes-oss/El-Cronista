"use client";

import { TechnicalHud } from "./TechnicalHud";

type Props = {
  accent: string;
  sheetName: string;
  clanLabel: string;
  healthFilled: number;
  healthMax: number;
  hunger: number;
  /** Abre ProfileHub (lista de CV). */
  onPersonajes: () => void;
  onHoja: () => void;
  onCodex: () => void;
  codexButtonLabel: string;
  onLogout: () => void;
  /** Reinicia buffer del hilo activo (confirmación externa opcional antes de llamar). */
  onNuevaEscena: () => void;
  isNarrator: boolean;
  onCentroMando?: () => void;
};

/**
 * Carril lateral “mesa tipo opción 5”: navegación gótico-punk y HUD compacto (solo vista Nexo xl+).
 */
export function SidebarMesa({
  accent,
  sheetName,
  clanLabel,
  healthFilled,
  healthMax,
  hunger,
  onPersonajes,
  onHoja,
  onCodex,
  codexButtonLabel,
  onLogout,
  onNuevaEscena,
  isNarrator,
  onCentroMando,
}: Props) {
  return (
    <aside
      className="sticky top-0 hidden h-[calc(100vh-5rem)] max-h-[calc(100dvh-5rem)] min-h-0 w-[11.5rem] shrink-0 flex-col gap-4 overflow-y-auto border-r border-[#2a2a30] bg-[color:var(--paper)]/40 px-3 py-4 xl:flex"
      aria-label="Mesa Nexo · accesos"
    >
      <div className="space-y-0.5 border-b border-[#27272f] pb-3">
        <p className="gothic-title text-[15px] font-medium leading-snug tracking-tight text-neutral-50">
          El Cronista de las Sombras
        </p>
        <p className="text-[7px] uppercase tracking-[0.38em] text-neutral-600">mesa · proyecto sereno</p>
      </div>

      <div className="rounded-xl border border-[#3f3f46]/80 bg-black/35 p-2">
        <TechnicalHud
          healthFilled={healthFilled}
          healthMax={healthMax}
          hunger={hunger}
          className="!flex-col !items-start gap-2.5 sm:!flex-col sm:!items-start"
        />
      </div>

      <div className="min-w-0">
        <p className="truncate font-sans text-[11px] font-medium tracking-tight text-neutral-200" title={sheetName}>
          {sheetName || "Sin nombre"}
        </p>
        <p className="truncate text-[9px]" style={{ color: accent }}>
          {clanLabel}
        </p>
      </div>

      <nav className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onPersonajes}
          className="rounded-lg border border-zinc-800 bg-black/45 px-2 py-2 text-left font-mono text-[8px] uppercase tracking-[0.2em] text-neutral-400 transition hover:border-[color:var(--neon)]/40 hover:text-neutral-100"
        >
          Personajes
        </button>
        <button
          type="button"
          onClick={onNuevaEscena}
          className="rounded-lg border bg-[color:var(--crimson)]/15 px-2 py-2 text-left font-mono text-[8px] uppercase tracking-[0.2em] text-[color:var(--crimson)] transition hover:bg-[color:var(--crimson)]/28"
          style={{ borderColor: `${accent}33` }}
        >
          Nueva escena
        </button>
        <button
          type="button"
          onClick={onHoja}
          className="rounded-lg border border-zinc-800 bg-black/45 px-2 py-2 text-left font-mono text-[8px] uppercase tracking-[0.2em] text-neutral-400 transition hover:border-neutral-600 hover:text-neutral-100"
        >
          Hoja CODEX
        </button>
        <button
          type="button"
          onClick={onCodex}
          className="rounded-lg border border-zinc-800 bg-black/45 px-2 py-2 text-left font-mono text-[8px] uppercase tracking-[0.2em] text-neutral-400 transition hover:border-neutral-500 hover:text-neutral-100"
        >
          {codexButtonLabel}
        </button>

        {isNarrator && onCentroMando ? (
          <button
            type="button"
            onClick={onCentroMando}
            className="rounded-lg border border-[#7f1d1d]/50 bg-black/55 px-2 py-2 text-left font-mono text-[8px] uppercase tracking-[0.2em] text-[#fca5a5]/90 transition hover:border-[#b91c1c]/70"
          >
            Centro de Mando
          </button>
        ) : null}

        <button
          type="button"
          onClick={onLogout}
          className="mt-2 rounded-lg border border-[var(--blood)]/35 px-2 py-2 text-left font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--blood)] transition hover:bg-[var(--blood)]/10"
        >
          Logout
        </button>
      </nav>
    </aside>
  );
}
