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
    <section className="nexo-gothic-shell relative shrink-0 overflow-hidden rounded-xl border border-[#2f2f36]/90 bg-gradient-to-b from-black/50 to-black/30 p-4 font-mono text-[10px] text-neutral-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-5">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}66, transparent)` }}
        aria-hidden
      />
      <header className="mb-4 border-b border-[#2a2a30] pb-3 font-sans text-[10px] font-medium tracking-[0.18em] text-neutral-400">
        Voluntad · motor del Cronista
      </header>

      <label className="mb-3 block">
        <span className="text-[9px] uppercase tracking-[0.16em] text-neutral-500" style={{ color: accent }}>
          Intención (opcional)
        </span>
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          disabled={isProcessing}
          rows={2}
          placeholder="Tono, apuesta, lo que buscas con la tirada…"
          className="mt-1.5 w-full resize-none rounded-md border border-[#2a2a30] bg-black/55 px-3 py-2.5 text-[10px] text-neutral-200 placeholder:text-neutral-600 focus:border-[var(--terminal)]/45 focus:outline-none focus:ring-1 focus:ring-[var(--terminal)]/15 disabled:opacity-45"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-[0.16em] text-neutral-500" style={{ color: accent }}>
            Atributo
          </span>
          <select
            value={attrKey}
            onChange={(e) => setAttrKey(e.target.value as keyof CharacterSheet["attributes"])}
            disabled={isProcessing}
            className="cursor-pointer rounded-md border border-[#2a2a30] bg-black/65 px-2 py-2 text-neutral-300 focus:border-[var(--terminal)]/40 focus:outline-none disabled:opacity-45"
          >
            {ATTRIBUTE_KEYS.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label} [{sheet.attributes[a.key]}]
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-[0.16em] text-neutral-500" style={{ color: accent }}>
            Habilidad
          </span>
          <select
            value={skillKey}
            onChange={(e) => setSkillKey(e.target.value)}
            disabled={isProcessing}
            className="cursor-pointer rounded-md border border-[#2a2a30] bg-black/65 px-2 py-2 text-neutral-300 focus:border-[var(--terminal)]/40 focus:outline-none disabled:opacity-45"
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
        <p className="mt-3 rounded-md border border-[#7f1d1d]/50 bg-black/50 px-3 py-2 text-[var(--blood)]/90">
          Sin impulso de interfaz — espera el ciclo de 24 h o escribe en el canal.
        </p>
      ) : isNarrator ? (
        <p className="mt-3 rounded-md border border-[#27272f] bg-black/45 px-3 py-2 text-[10px] text-[var(--terminal)]">
          Pool {pool} · dados normales {Math.max(0, pool - hungerDicePool)} · Σh {hungerDicePool}
        </p>
      ) : (
        <p className="mt-3 rounded-md border border-[#27272f] bg-black/40 px-3 py-2 text-[9px] leading-snug text-neutral-500">
          La tirada corre en tu perfil — el Nexo sólo muestra la salida.
        </p>
      )}

      {isNarrator && (
        <label className="mt-3 flex max-w-[11rem] flex-col gap-1">
          <span className="text-[9px] uppercase tracking-[0.12em] text-neutral-600">Dificultad (DF)</span>
          <input
            type="number"
            min={0}
            max={8}
            value={rollDifficulty}
            onChange={(e) => setRollDifficulty(Number(e.target.value))}
            disabled={isProcessing}
            className="rounded-md border border-[#2a2a30] bg-black/60 px-2 py-2 text-neutral-300 focus:border-[var(--terminal)]/35 focus:outline-none disabled:opacity-45"
          />
        </label>
      )}

      <form onSubmit={manifest} className="mt-6 flex flex-col items-center gap-2">
        <motion.button
          type="submit"
          disabled={isProcessing || impulseBlocked}
          whileHover={{ scale: isProcessing ? 1 : 1.015 }}
          whileTap={{ scale: isProcessing ? 1 : 0.985 }}
          className="rounded-lg border px-12 py-3.5 font-sans text-[11px] font-semibold uppercase tracking-[0.32em] transition-shadow disabled:opacity-45 disabled:shadow-none"
          style={{
            borderColor: `${accent}99`,
            color: accent,
            boxShadow: `0 12px 32px rgba(0,0,0,0.55), inset 0 1px 0 ${accent}40`,
          }}
        >
          Manifestar
        </motion.button>
        {isProcessing ? (
          <p className="animate-pulse font-mono text-[9px] uppercase tracking-[0.35em] text-[var(--terminal)]">
            PROCESANDO<span className="inline-block w-3 animate-pulse">█</span>
          </p>
        ) : null}
      </form>

      <div className="mt-5 border-t border-[#2a2a30] pt-4">
        <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-neutral-600">Último veredicto</p>
        <div className="mt-2 min-h-[2rem] font-sans text-[12px]">
          {!lastPlayerLabel ? (
            <span className="text-neutral-600">Sin tirada aún</span>
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
