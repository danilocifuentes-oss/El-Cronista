"use client";

import { rollPoolV5, summarizeRollNarrator } from "@/lib/dice";
import type { CharacterSheet } from "@/lib/character";
import type { ForcedRollKind } from "@/context/GameSessionContext";

type Props = {
  forced: null | {
    kind: ForcedRollKind;
    difficulty: number;
  };
  sheet: CharacterSheet;
  hungerLevel: number;
  onConsume: (narratorLine: string) => void;
};

function poolForForced(kind: ForcedRollKind, sheet: CharacterSheet): number {
  if (kind === "frenesy") {
    return Math.min(15, Math.max(1, sheet.attributes.res + sheet.attributes.com));
  }
  return Math.min(15, Math.max(1, sheet.attributes.str + sheet.attributes.sta));
}

export function ForcedDestinyOverlay({ forced, sheet, hungerLevel, onConsume }: Props) {
  if (!forced) return null;

  function accept() {
    const spec = forced;
    if (!spec) return;
    const pool = poolForForced(spec.kind, sheet);
    const hungerDice = Math.min(pool, hungerLevel);
    const r = rollPoolV5(pool, hungerDice, spec.difficulty);
    const headline =
      spec.kind === "frenesy"
        ? "TIRADA DE FRENESÍ | Resolución+Compostura"
        : "CHEQUEO DE ENARDECIMIENTO | Fuerza+Resistencia";
    const narr = `[${headline}] Pool ${pool} (carmesí ${hungerDice}) · DF ${spec.difficulty} · ${summarizeRollNarrator(r)}`;
    onConsume(narr);
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 px-6 backdrop-blur-sm">
      <div className="max-w-lg border border-[var(--blood)] bg-neutral-950/98 p-8 text-center sharp-border-inner shadow-[0_0_60px_rgba(139,0,0,0.55)] techno-grid relative">
        <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-[var(--blood)]">
          Orden Mnemósine — {forced.kind === "frenesy" ? "frenesí" : "enardecimiento"}
        </p>
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-neutral-400">
          El Nexo proyecta sólo esta elección sobre tu estatus civil.
        </p>
        <button
          type="button"
          onClick={accept}
          className="mt-10 w-full border-2 border-[var(--blood)] bg-black py-6 font-mono text-sm font-black uppercase tracking-[0.42em] text-[var(--blood)] sharp-border-inner hover:bg-[var(--blood)]/10"
        >
          Aceptar el destino
        </button>
      </div>
    </div>
  );
}
