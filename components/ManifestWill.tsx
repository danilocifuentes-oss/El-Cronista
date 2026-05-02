"use client";

import { useMemo, useState } from "react";
import type { CharacterSheet } from "@/lib/character";
import { ATTRIBUTE_KEYS, SKILL_KEYS } from "@/lib/character";
import { rollPoolV5, summarizeRollNarrator, type PlayerOutcomeLabel } from "@/lib/dice";
import { useGameSession } from "@/context/GameSessionContext";

type Props = {
  sheet: CharacterSheet;
  hungerLevel: number;
  /** Narrador: log técnico; jugador sólo resultado cifrado */
  onResolve: (narratorLine: string, playerFacing: PlayerOutcomeLabel) => void;
};

export function ManifestWill({ sheet, hungerLevel, onResolve }: Props) {
  const { isNarrator, rollDifficulty, setRollDifficulty } = useGameSession();

  const [attrKey, setAttrKey] = useState<(typeof ATTRIBUTE_KEYS)[number]["key"]>("wit");
  const [skillKey, setSkillKey] = useState<string>(
    SKILL_KEYS.find((sk) => sk === "Tecnología") ?? SKILL_KEYS[0],
  );
  const [lastPlayerLabel, setLastPlayerLabel] = useState<PlayerOutcomeLabel | null>(null);

  const pool = useMemo(() => {
    const a = sheet.attributes[attrKey];
    const s = typeof sheet.skills[skillKey] === "number" ? sheet.skills[skillKey] : 0;
    return Math.max(1, a + s);
  }, [sheet.attributes, sheet.skills, attrKey, skillKey]);

  const hungerDicePool = Math.min(pool, hungerLevel);

  function manifest(e: React.FormEvent) {
    e.preventDefault();
    const r = rollPoolV5(pool, hungerDicePool, rollDifficulty);
    const narr = summarizeRollNarrator(r);
    const detail = `[Pool ${pool} = atr(${attrKey}) + hab (${skillKey}) | rojos=${hungerDicePool}] · ${narr}`;
    setLastPlayerLabel(r.outcome);
    onResolve(detail, r.outcome);
  }

  return (
    <section className="mnemosyne-panel techno-grid mt-4 border border-neutral-800 bg-neutral-950/90 p-5 font-mono text-xs sharp-border-inner">
      <header className="mb-4 flex flex-col gap-1 border-b border-neutral-800 pb-3">
        <p className="text-[10px] uppercase tracking-[0.38em] text-[var(--terminal)]">
          PROTOCOLO · MANIFESTAR VOLUNTAD
        </p>
        <p className="font-sans text-[11px] font-normal tracking-wide text-neutral-500">
          El archivo legal calcula tu reserva. No negocie el número de dados.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-neutral-500">
          <span className="text-[10px] uppercase tracking-wider">Atributo (registro físico/psíquico)</span>
          <select
            value={attrKey}
            onChange={(e) =>
              setAttrKey(e.target.value as keyof CharacterSheet["attributes"])
            }
            className="border border-neutral-700 bg-black px-2 py-2 text-neutral-200 sharp-border-inner"
          >
            {ATTRIBUTE_KEYS.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label} ({sheet.attributes[a.key]})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-neutral-500">
          <span className="text-[10px] uppercase tracking-wider">Habilidad civil</span>
          <select
            value={skillKey}
            onChange={(e) => setSkillKey(e.target.value)}
            className="border border-neutral-700 bg-black px-2 py-2 text-neutral-200 sharp-border-inner"
          >
            {SKILL_KEYS.map((sk) => (
              <option key={sk} value={sk}>
                {sk} ({sheet.skills[sk] ?? 0})
              </option>
            ))}
          </select>
        </label>
      </div>

      {isNarrator ? (
        <p className="mt-4 border border-neutral-800 bg-black/50 px-3 py-2 text-[var(--terminal)]">
          RESERVA CAINITA DETECTADA: <strong>{pool}</strong> dados ·{" "}
          <strong className="text-neutral-400">{Math.max(0, pool - hungerDicePool)} negros</strong> ·{" "}
          <strong className="text-[var(--blood)]">{hungerDicePool} carmesí</strong> [Hambre]
        </p>
      ) : (
        <p className="mt-4 border border-neutral-800 bg-black/60 px-3 py-2 text-neutral-500">
          Se ha enviado el protocolo Mnemósine. Espera sello civil oficial.
        </p>
      )}

      {isNarrator && (
        <label className="mt-4 flex max-w-xs flex-col gap-1 text-neutral-500">
          <span className="text-[10px] uppercase tracking-wider">Dificultad (sólo narrador)</span>
          <input
            type="number"
            min={0}
            max={8}
            value={rollDifficulty}
            onChange={(e) => setRollDifficulty(Number(e.target.value))}
            className="border border-neutral-700 bg-black px-2 py-2 text-neutral-200"
          />
        </label>
      )}

      <form onSubmit={manifest}>
        <button
          type="submit"
          className="mt-5 w-full border border-[var(--terminal)] px-6 py-3 text-[12px] font-bold uppercase tracking-[0.22em] text-[var(--terminal)] sharp-border-inner hover:bg-[var(--terminal)]/10"
        >
          Manifestar voluntad
        </button>
      </form>

      <div className="mt-4 border-t border-neutral-800 pt-4">
        <p className="text-[10px] uppercase tracking-wider text-neutral-600">
          Estado civil (clave de lectura restringida)
        </p>
        <div className="mt-2 min-h-[2.75rem] font-sans text-sm tracking-wide">
          {!lastPlayerLabel ? (
            <span className="text-neutral-600">Pulse manifestación para obtener veredicto.</span>
          ) : (
            <span className={`verdict-${lastPlayerLabel === "ÉXITO" ? "hit" : lastPlayerLabel === "FRACASO" ? "miss" : "beast"}`}>
              {lastPlayerLabel === "ÉXITO" && "ÉXITO"}
              {lastPlayerLabel === "FRACASO" && "FRACASO"}
              {lastPlayerLabel === "CONSECUENCIAS DE LA BESTIA" && "CONSECUENCIAS DE LA BESTIA"}
            </span>
          )}
        </div>
        {lastPlayerLabel && (
          <p className="mt-1 text-[10px] text-neutral-600">
            {isNarrator
              ? "Como Narrador ves el log técnico en el Nexo inferior."
              : "La dificultad y la tinta técnica están ocultas por protocolo Tecnocracia."}
          </p>
        )}
      </div>
    </section>
  );
}
