"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { CharacterSheet } from "@/lib/character";
import { ATTRIBUTE_KEYS } from "@/lib/character";
import { SERENO_SKILLS } from "@/lib/sereno";
import { rollPoolV5, summarizeRollNarrator, outcomeCode, type PlayerOutcomeLabel } from "@/lib/dice";
import { useGameSession } from "@/context/GameSessionContext";

type Props = {
  sheet: CharacterSheet;
  hungerLevel: number;
  accent: string;
  onResolve: (narratorLine: string, playerFacing: PlayerOutcomeLabel) => void;
};

export function ManifestWill({ sheet, hungerLevel, accent, onResolve }: Props) {
  const { isNarrator, rollDifficulty, setRollDifficulty } = useGameSession();

  const [attrKey, setAttrKey] = useState<(typeof ATTRIBUTE_KEYS)[number]["key"]>("wit");
  const [skillKey, setSkillKey] = useState<string>(
    SERENO_SKILLS.find((sk) => sk.key === "tecnologia")?.key ?? SERENO_SKILLS[0].key,
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
    const ledger = summarizeRollNarrator(r);
    const detail = `[MANIFEST]: sujeto emite voluntad · ${attrKey}+${skillKey} · pool:${pool}(Σh:${hungerDicePool}) · DF:${rollDifficulty} · ${ledger}`;
    setLastPlayerLabel(r.outcome);
    onResolve(detail, r.outcome);
  }

  return (
    <section className="relative mt-6 border border-[#161616] bg-black/30 p-4 font-mono text-[10px] text-neutral-500">
      <header className="mb-4 border-b border-[#161616] pb-3 font-mono text-[9px] uppercase tracking-[0.32em] text-neutral-600">
        {"//_VOLUNTAD"}
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-wider text-neutral-600" style={{ color: accent }}>
            &gt;_ATRIBUTO
          </span>
          <select
            value={attrKey}
            onChange={(e) => setAttrKey(e.target.value as keyof CharacterSheet["attributes"])}
            className="cursor-pointer border border-[#161616] bg-black/60 px-2 py-2 text-neutral-400 focus:border-[var(--terminal)]/40 focus:outline-none"
          >
            {ATTRIBUTE_KEYS.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label} [{sheet.attributes[a.key]}]
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-wider text-neutral-600" style={{ color: accent }}>
            &gt;_HAB
          </span>
          <select
            value={skillKey}
            onChange={(e) => setSkillKey(e.target.value)}
            className="cursor-pointer border border-[#161616] bg-black/60 px-2 py-2 text-neutral-400 focus:border-[var(--terminal)]/40 focus:outline-none"
          >
            {SERENO_SKILLS.map(({ key, label }) => (
              <option key={key} value={key}>
                {label} [{sheet.skills[key] ?? 0}]
              </option>
            ))}
          </select>
        </label>
      </div>

      {isNarrator ? (
        <p className="mt-3 border border-[#161616] bg-black/40 px-2 py-1.5 text-[var(--terminal)]">
          VECTOR:{pool} · N:{Math.max(0, pool - hungerDicePool)} · Σh:{hungerDicePool}
        </p>
      ) : (
        <p className="mt-3 border border-[#161616] bg-black/40 px-2 py-1.5 opacity-75">[&gt;_EN_COLA_PIPELINE]</p>
      )}

      {isNarrator && (
        <label className="mt-3 flex max-w-[10rem] flex-col gap-1">
          <span className="text-[9px] uppercase text-neutral-600">{"//_FACTOR_DIFF"}</span>
          <input
            type="number"
            min={0}
            max={8}
            value={rollDifficulty}
            onChange={(e) => setRollDifficulty(Number(e.target.value))}
            className="border border-[#161616] bg-black/60 px-2 py-1.5 text-neutral-300 focus:outline-none"
          />
        </label>
      )}

      <form onSubmit={manifest} className="mt-5 flex justify-center">
        <motion.button
          type="submit"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="border px-14 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.4em]"
          style={{ borderColor: accent, color: accent, boxShadow: `inset 0 0 18px ${accent}26` }}
        >
          MANIFESTAR
        </motion.button>
      </form>

      <div className="mt-4 border-t border-[#161616] pt-4">
        <p className="text-[9px] uppercase tracking-[0.28em] text-neutral-600">{"//_OUT"}</p>
        <div className="mt-2 min-h-[2rem] text-[11px]">
          {!lastPlayerLabel ? (
            <span className="text-neutral-600">[NULL]</span>
          ) : (
            <span
              className={`verdict-${lastPlayerLabel === "ÉXITO" ? "hit" : lastPlayerLabel === "FRACASO" ? "miss" : "beast"}`}
            >
              {outcomeCode(lastPlayerLabel)}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
