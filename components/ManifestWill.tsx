"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { CharacterSheet } from "@/lib/character";
import { ATTRIBUTE_KEYS } from "@/lib/character";
import { SERENO_SKILLS } from "@/lib/sereno";
import { rollPoolV5, summarizeRollNarrator, outcomeCode, type PlayerOutcomeLabel, type V5RollResult } from "@/lib/dice";
import { useGameSession } from "@/context/GameSessionContext";

type Props = {
  sheet: CharacterSheet;
  hungerLevel: number;
  accent: string;
  onManifest: (payload: { roll: V5RollResult; intent: string; ledgerLine: string }) => void | Promise<void>;
  isProcessing?: boolean;
  /** Penalización Letargo / Anacronismo (−1 a la reserva, mín. 1 dado). */
  poolPenalty?: number;
  /** Sin UI — bloquea manifestar. */
  impulseBlocked?: boolean;
};

export function ManifestWill({
  sheet,
  hungerLevel,
  accent,
  onManifest,
  isProcessing,
  poolPenalty = 0,
  impulseBlocked = false,
}: Props) {
  const { isNarrator, rollDifficulty, setRollDifficulty } = useGameSession();

  const [attrKey, setAttrKey] = useState<(typeof ATTRIBUTE_KEYS)[number]["key"]>("wit");
  const [skillKey, setSkillKey] = useState<string>(
    SERENO_SKILLS.find((sk) => sk.key === "tecnologia")?.key ?? SERENO_SKILLS[0].key,
  );
  const [lastPlayerLabel, setLastPlayerLabel] = useState<PlayerOutcomeLabel | null>(null);
  const [intent, setIntent] = useState("");

  const pool = useMemo(() => {
    const a = sheet.attributes[attrKey];
    const s = typeof sheet.skills[skillKey] === "number" ? sheet.skills[skillKey] : 0;
    return Math.max(1, a + s - Math.max(0, poolPenalty));
  }, [sheet.attributes, sheet.skills, attrKey, skillKey, poolPenalty]);

  const hungerDicePool = Math.min(pool, hungerLevel);

  function manifest(e: React.FormEvent) {
    e.preventDefault();
    if (isProcessing || impulseBlocked) return;
    const r = rollPoolV5(pool, hungerDicePool, rollDifficulty);
    const ledger = summarizeRollNarrator(r);
    const pen = poolPenalty > 0 ? ` · LETARGO:-${poolPenalty}` : "";
    const detail = `[MANIFEST]: sujeto emite voluntad · ${attrKey}+${skillKey} · pool:${pool}(Σh:${hungerDicePool}) · DF:${rollDifficulty}${pen} · ${ledger}`;
    setLastPlayerLabel(r.outcome);
    void onManifest({ roll: r, intent: intent.trim(), ledgerLine: detail });
  }

  return (
    <section className="relative mt-6 border border-[#161616] bg-black/30 p-4 font-mono text-[10px] text-neutral-500">
      <header className="mb-4 border-b border-[#161616] pb-3 font-mono text-[9px] uppercase tracking-[0.32em] text-neutral-600">
        {"//_VOLUNTAD · MOTOR_CRONISTA"}
      </header>

      <label className="mb-3 block">
        <span className="text-[9px] uppercase tracking-wider text-neutral-600" style={{ color: accent }}>
          &gt;_INTENCIÓN (opcional — contexto para el Cronista)
        </span>
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          disabled={isProcessing}
          rows={2}
          placeholder="Opcional: tono, objetivo o detalle para el Cronista (tirada + intención)…"
          className="mt-1.5 w-full resize-none border border-[#161616] bg-black/50 px-2 py-2 text-[10px] text-neutral-300 placeholder:text-neutral-600 focus:border-[var(--terminal)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--terminal)]/12 disabled:opacity-45"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-wider text-neutral-600" style={{ color: accent }}>
            &gt;_ATRIBUTO
          </span>
          <select
            value={attrKey}
            onChange={(e) => setAttrKey(e.target.value as keyof CharacterSheet["attributes"])}
            disabled={isProcessing}
            className="cursor-pointer border border-[#161616] bg-black/60 px-2 py-2 text-neutral-400 focus:border-[var(--terminal)]/40 focus:outline-none disabled:opacity-45"
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
            disabled={isProcessing}
            className="cursor-pointer border border-[#161616] bg-black/60 px-2 py-2 text-neutral-400 focus:border-[var(--terminal)]/40 focus:outline-none disabled:opacity-45"
          >
            {SERENO_SKILLS.map(({ key, label }) => (
              <option key={key} value={key}>
                {label} [{sheet.skills[key] ?? 0}]
              </option>
            ))}
          </select>
        </label>
      </div>

      {impulseBlocked ? (
        <p className="mt-3 border border-[#7f1d1d]/50 bg-black/50 px-2 py-1.5 text-[var(--blood)]/90">
          [IMPULSE_LOCK]: sin UI — espera el ciclo o interactúa en el canal.
        </p>
      ) : isNarrator ? (
        <p className="mt-3 border border-[#222] bg-black/40 px-2 py-1.5 text-[var(--terminal)]">
          VECTOR:{pool} · N:{Math.max(0, pool - hungerDicePool)} · Σh:{hungerDicePool}
        </p>
      ) : (
        <p className="mt-3 border border-[#222] bg-black/40 px-2 py-1.5 opacity-75">[&gt;_PIPE_LOCAL]</p>
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
            disabled={isProcessing}
            className="border border-[#161616] bg-black/60 px-2 py-1.5 text-neutral-300 focus:outline-none disabled:opacity-45"
          />
        </label>
      )}

      <form onSubmit={manifest} className="mt-5 flex flex-col items-center gap-2">
        <motion.button
          type="submit"
          disabled={isProcessing || impulseBlocked}
          whileHover={{ scale: isProcessing ? 1 : 1.01 }}
          whileTap={{ scale: isProcessing ? 1 : 0.99 }}
          className="border px-14 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.4em] disabled:opacity-45"
          style={{ borderColor: accent, color: accent, boxShadow: `inset 0 0 18px ${accent}26` }}
        >
          MANIFESTAR
        </motion.button>
        {isProcessing ? (
          <p className="animate-pulse font-mono text-[9px] uppercase tracking-[0.35em] text-[var(--terminal)]">
            PROCESANDO<span className="inline-block w-3 animate-pulse">█</span>
          </p>
        ) : null}
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
