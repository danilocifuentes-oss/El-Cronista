"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState, useCallback } from "react";
import type { CharacterSheet } from "@/lib/character";
import { ATTRIBUTE_KEYS } from "@/lib/character";
import { SERENO_SKILLS } from "@/lib/sereno";
import {
  rollPoolV5,
  summarizeRollPlayerLog,
  outcomeCode,
  type PlayerOutcomeLabel,
  type V5RollResult,
} from "@/lib/dice";
import { useGameSession } from "@/context/GameSessionContext";
import { NexusLibrary } from "@/components/icons/NexusLibrary";

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
  const reduceMotion = useReducedMotion();

  const [attrKey, setAttrKey] = useState<(typeof ATTRIBUTE_KEYS)[number]["key"]>("wit");
  const [skillKey, setSkillKey] = useState<string>(
    SERENO_SKILLS.find((sk) => sk.key === "tecnologia")?.key ?? SERENO_SKILLS[0].key,
  );
  const [lastPlayerLabel, setLastPlayerLabel] = useState<PlayerOutcomeLabel | null>(null);
  const [intent, setIntent] = useState("");
  const [sparkBurst, setSparkBurst] = useState(false);

  const triggerSpark = useCallback(() => {
    setSparkBurst(true);
    window.setTimeout(() => setSparkBurst(false), 240);
  }, []);

  const pool = useMemo(() => {
    const a = sheet.attributes[attrKey];
    const s = typeof sheet.skills[skillKey] === "number" ? sheet.skills[skillKey] : 0;
    return Math.max(1, a + s - Math.max(0, poolPenalty));
  }, [sheet.attributes, sheet.skills, attrKey, skillKey, poolPenalty]);

  const hungerDicePool = Math.min(pool, hungerLevel);
  const stableDice = Math.max(0, pool - hungerDicePool);

  const attrLabel = ATTRIBUTE_KEYS.find((a) => a.key === attrKey)?.label ?? "Atributo";
  const skillLabel = SERENO_SKILLS.find((s) => s.key === skillKey)?.label ?? "Habilidad";

  function manifest(e: React.FormEvent) {
    e.preventDefault();
    if (isProcessing || impulseBlocked) return;
    triggerSpark();
    const r = rollPoolV5(pool, hungerDicePool, rollDifficulty);
    const ledgerRoll = summarizeRollPlayerLog(r);
    const letargo =
      poolPenalty > 0 ? ` · Letargo aplicado (−${poolPenalty} a la reserva, mínimo 1 dado)` : "";
    const detail = `Manifestar · ${attrLabel} + ${skillLabel} · reserva ${pool} (canal estable ${stableDice} · eco sangrado ${hungerDicePool}) · umbral ${rollDifficulty}${letargo} · ${ledgerRoll}`;
    setLastPlayerLabel(r.outcome);
    void onManifest({ roll: r, intent: intent.trim(), ledgerLine: detail });
  }

  return (
    <section
      data-manifest-zone
      className="relative shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-[linear-gradient(165deg,rgba(8,8,10,0.97),rgba(5,5,8,0.99))] p-4 font-mono text-[10px] text-neutral-500 shadow-[inset_0_1px_0_rgba(57,255,20,0.05)] sm:p-5"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}55, transparent)` }}
        aria-hidden
      />

      <header className="relative mb-4 flex items-center gap-2 border-b border-white/[0.08] pb-3">
        <NexusLibrary.Destino className="h-5 w-5 shrink-0 text-[color:var(--terminal)] opacity-90" />
        <NexusLibrary.Circuit className="h-4 w-4 shrink-0 text-[color:var(--terminal)]/50" />
        <div className="min-w-0 flex-1 font-sans">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--terminal)]/85">
            //_MANIFEST · RESERVA
          </p>
          <p className="mt-0.5 text-[8px] uppercase tracking-[0.35em] text-neutral-600">Voluntad · canal SchreckNet</p>
        </div>
      </header>

      <label className="relative mb-3 block">
        <span className="text-[9px] uppercase tracking-[0.22em] text-neutral-500" style={{ color: accent }}>
          //_INTENCION (opcional)
        </span>
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          disabled={isProcessing}
          rows={2}
          placeholder="Tono, apuesta, qué buscás con la tirada…"
          className="mt-1.5 w-full resize-none rounded-md border border-white/[0.08] bg-black/60 px-3 py-2.5 font-sans text-[11px] text-neutral-200 placeholder:text-neutral-600 focus:border-[color:var(--terminal)]/40 focus:outline-none focus:ring-1 focus:ring-[color:var(--terminal)]/12 disabled:opacity-45"
        />
      </label>

      <div className="relative grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-500" style={{ color: accent }}>
            //_ATRIBUTO
          </span>
          <select
            value={attrKey}
            onChange={(e) => setAttrKey(e.target.value as keyof CharacterSheet["attributes"])}
            disabled={isProcessing}
            className="cursor-pointer rounded-md border border-white/[0.08] bg-black/70 px-2 py-2 font-sans text-[11px] text-neutral-200 focus:border-[color:var(--terminal)]/35 focus:outline-none disabled:opacity-45"
          >
            {ATTRIBUTE_KEYS.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label} [{sheet.attributes[a.key]}]
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-500" style={{ color: accent }}>
            //_HABILIDAD
          </span>
          <select
            value={skillKey}
            onChange={(e) => setSkillKey(e.target.value)}
            disabled={isProcessing}
            className="cursor-pointer rounded-md border border-white/[0.08] bg-black/70 px-2 py-2 font-sans text-[11px] text-neutral-200 focus:border-[color:var(--terminal)]/35 focus:outline-none disabled:opacity-45"
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
        <p className="relative mt-3 rounded-md border border-[#7f1d1d]/45 bg-black/55 px-3 py-2 text-[10px] text-[color:var(--blood)]/95">
          Sin impulso de interfaz — esperá el ciclo o escribí en el canal antes de volver a manifestar.
        </p>
      ) : isNarrator ? (
        <p className="relative mt-3 rounded-md border border-white/[0.06] bg-black/50 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[color:var(--terminal)]/90">
          Reserva {pool} · canal estable {stableDice} · eco sangrado {hungerDicePool}
        </p>
      ) : (
        <p className="relative mt-3 rounded-md border border-white/[0.05] bg-black/45 px-3 py-2 font-sans text-[10px] leading-snug text-neutral-500">
          La tirada corre en tu perfil; el Nexo sólo refleja el veredicto en esta consola.
        </p>
      )}

      {isNarrator && (
        <label className="relative mt-3 flex max-w-[12rem] flex-col gap-1">
          <span className="text-[9px] uppercase tracking-[0.18em] text-neutral-600">//_UMBRAL (DF)</span>
          <input
            type="number"
            min={0}
            max={8}
            value={rollDifficulty}
            onChange={(e) => setRollDifficulty(Number(e.target.value))}
            disabled={isProcessing}
            className="rounded-md border border-white/[0.08] bg-black/65 px-2 py-2 text-neutral-200 focus:border-[color:var(--terminal)]/35 focus:outline-none disabled:opacity-45"
          />
        </label>
      )}

      <form onSubmit={manifest} className="relative mt-6 flex flex-col items-center gap-2">
        <motion.button
          type="submit"
          disabled={isProcessing || impulseBlocked}
          whileHover={reduceMotion || isProcessing ? undefined : { scale: 1.015 }}
          whileTap={reduceMotion || isProcessing ? undefined : { scale: 0.97 }}
          className={`rounded-lg border px-10 py-3.5 font-sans text-[11px] font-semibold uppercase tracking-[0.3em] transition-shadow disabled:opacity-45 disabled:shadow-none ${sparkBurst ? "manifest-digital-spark" : ""}`}
          style={{
            borderColor: `${accent}99`,
            color: accent,
            boxShadow: `0 12px 32px rgba(0,0,0,0.55), inset 0 1px 0 ${accent}38`,
          }}
        >
          Manifestar
        </motion.button>
        {isProcessing ? (
          <p className="animate-pulse font-mono text-[9px] uppercase tracking-[0.35em] text-[color:var(--terminal)]">
            SINCRONIZANDO<span className="inline-block w-3 animate-pulse">█</span>
          </p>
        ) : null}
      </form>

      <div className="relative mt-5 border-t border-white/[0.07] pt-4">
        <div className="flex items-center gap-2">
          <NexusLibrary.Cronista className="h-4 w-4 text-[color:var(--terminal)]/60" />
          <p className="font-sans text-[9px] uppercase tracking-[0.22em] text-neutral-600">//_VEREDICTO</p>
        </div>
        <div className="mt-2 min-h-[2rem] font-sans text-[13px]">
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
