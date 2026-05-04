"use client";

import { rollPoolV5, summarizeRollPlayerLog } from "@/lib/dice";
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
    const atributos =
      spec.kind === "frenesy" ? "Resolución y Compostura" : "Fuerza y Resistencia";
    const narr = summarizeRollPlayerLog(r);
    onConsume(
      `Tirada forzada (${spec.kind === "frenesy" ? "frenesí" : "enardecimiento"}) · ${atributos} · reserva ${pool} (eco sangrado ${hungerDice}) · umbral ${spec.difficulty} · ${narr}`,
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 px-5 backdrop-blur-[1px]">
      <div className="w-full max-w-md border border-[var(--blood)]/80 bg-[#070707] px-6 py-7 font-mono text-center sharp-border-inner">
        <p className="text-[9px] uppercase tracking-[0.45em] text-[var(--blood)]">
          [&gt;_TIRADA_FORZADA_{forced.kind === "frenesy" ? "FRENESÍ" : "ENAR"}]
        </p>
        <button
          type="button"
          onClick={accept}
          className="mt-8 w-full border border-[var(--blood)] py-4 text-[10px] font-bold uppercase tracking-[0.42em] text-[var(--blood)] hover:bg-[var(--blood)]/10"
        >
          Confirmar tirada
        </button>
      </div>
    </div>
  );
}
