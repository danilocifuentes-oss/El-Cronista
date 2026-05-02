"use client";

import { useState } from "react";
import { rollPoolV5, summarizeRoll } from "@/lib/dice";

type Props = {
  /** Nivel de Hambre del personaje: máximo de dados de hambre en la tirada */
  hungerLevel: number;
  onAnnounce: (msg: string) => void;
};

export function DiceWidget({ hungerLevel, onAnnounce }: Props) {
  const [pool, setPool] = useState(6);
  const [hungerDice, setHungerDice] = useState(Math.min(1, Math.max(0, hungerLevel)));
  const [difficulty, setDifficulty] = useState(3);

  const cap = Math.min(pool, Math.max(0, hungerLevel));

  function roll(e: React.FormEvent) {
    e.preventDefault();
    const h = Math.min(Math.max(0, hungerDice), cap);
    const r = rollPoolV5(pool, h, difficulty);
    const diceStr = r.dice.map((d) => `${d.face}${d.hunger ? "H" : ""}`).join(", ");
    onAnnounce(`Tirada pool=${pool}, hambre=${h}, DF=${difficulty}: [${diceStr}] → ${summarizeRoll(r)}`);
  }

  return (
    <form
      onSubmit={roll}
      className="mt-6 border border-neutral-800 bg-black/70 p-4 font-mono text-xs sharp-border-inner"
    >
      <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-[var(--terminal)]">
        Resolución V5 (éxitos 6+, 10 = +2 éxitos; dados H = hambre — demo)
      </p>
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-neutral-500">
          Pool
          <input
            type="number"
            min={1}
            max={20}
            value={pool}
            onChange={(e) => {
              const p = Number(e.target.value);
              setPool(p);
              setHungerDice((prev) => Math.min(prev, Math.min(p, Math.max(0, hungerLevel))));
            }}
            className="w-20 border border-neutral-700 bg-neutral-950 px-2 py-1 text-neutral-200"
          />
        </label>
        <label className="flex flex-col gap-1 text-neutral-500">
          Dados hambre (máx. {cap})
          <input
            type="number"
            min={0}
            max={cap}
            value={Math.min(hungerDice, cap)}
            onChange={(e) => setHungerDice(+e.target.value)}
            className="w-20 border border-neutral-700 bg-neutral-950 px-2 py-1 text-neutral-200"
          />
        </label>
        <label className="flex flex-col gap-1 text-neutral-500">
          Dificultad
          <input
            type="number"
            min={0}
            max={6}
            value={difficulty}
            onChange={(e) => setDifficulty(+e.target.value)}
            className="w-20 border border-neutral-700 bg-neutral-950 px-2 py-1 text-neutral-200"
          />
        </label>
      </div>
      <button
        type="submit"
        className="mt-4 border border-[var(--terminal)] px-6 py-2 text-[11px] font-bold uppercase tracking-widest text-[var(--terminal)] sharp-border-inner hover:bg-[var(--terminal)]/10"
      >
        Lanzar dados
      </button>
    </form>
  );
}
