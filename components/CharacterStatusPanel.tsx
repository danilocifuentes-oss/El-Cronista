"use client";

import { motion } from "framer-motion";
import type { CharacterSheet } from "@/lib/character";
import { CLAN_ACCENTS } from "@/lib/character";
import type { XpLogEntry } from "@/lib/sessionMeta";

type Props = {
  sheet: CharacterSheet;
  onChange: (next: CharacterSheet, logLine?: string) => void;
  xpLog?: XpLogEntry[];
  sheetLocked?: boolean;
  isNarrator?: boolean;
};

const HEALTH_MAX = 7;

export function CharacterStatusPanel({
  sheet,
  onChange,
  xpLog = [],
  sheetLocked = false,
  isNarrator = false,
}: Props) {
  const accent = CLAN_ACCENTS[sheet.clan];
  const healthFilled = HEALTH_MAX - Math.min(sheet.healthDamage, HEALTH_MAX);
  const wpPct = sheet.willpowerMax ? (sheet.willpowerCur / sheet.willpowerMax) * 100 : 0;

  const hungerInteractive = sheetLocked ? isNarrator : true;

  return (
    <aside className="flex h-full flex-col gap-6 border-neutral-800 bg-neutral-950/90 sharp-border-inner p-4 lg:w-80 lg:shrink-0">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--terminal)]">
          Estado
        </p>
        <h2 className="mt-2 font-sans text-lg font-semibold text-neutral-100">
          {sheet.name || "Sin nombre"}
        </h2>
        <p className="font-mono text-xs text-neutral-500">
          {sheet.clan} · {sheet.concept}
        </p>
        {sheetLocked && (
          <p className="mt-3 border border-neutral-800 bg-black/60 px-2 py-1 font-mono text-[10px] text-neutral-600">
            Ficha archivada. Protocolo de hambre bajo Narrador; salud/WP pueden ajustarse y quedarán auditados en bitácora.
          </p>
        )}
      </div>

      <div className="space-y-4 font-mono text-xs">
        <div>
          <div className="flex justify-between text-neutral-400">
            <span>
              Salud ({healthFilled}/{HEALTH_MAX})
            </span>
          </div>
          <div className="mt-2 flex h-2 gap-px overflow-hidden border border-neutral-700 sharp-border-inner">
            {Array.from({ length: HEALTH_MAX }, (_, i) => (
              <motion.div
                key={i}
                className={`h-full flex-1 ${i < healthFilled ? "" : "bg-[var(--blood)]/85"}`}
                style={{
                  background: i < healthFilled ? accent : undefined,
                  boxShadow: i < healthFilled ? `inset 0 0 8px ${accent}` : undefined,
                }}
                layout
              />
            ))}
          </div>
          <div className="mt-2">
            <button
              type="button"
              className="text-[10px] uppercase tracking-widest text-[var(--blood)] hover:underline"
              onClick={() =>
                onChange(
                  {
                    ...sheet,
                    healthDamage: Math.min(HEALTH_MAX, sheet.healthDamage + 1),
                  },
                  sheetLocked ? `Daño superficial +1 (${sheet.healthDamage + 1})` : undefined,
                )
              }
            >
              +daño superficial
            </button>
            <button
              type="button"
              className="ml-3 mt-2 text-[10px] uppercase tracking-widest text-[var(--terminal)] hover:underline"
              onClick={() =>
                onChange(
                  {
                    ...sheet,
                    healthDamage: Math.max(0, sheet.healthDamage - 1),
                  },
                  sheetLocked ? `Casilla recuperada (${Math.max(0, sheet.healthDamage - 1)} daños)` : undefined,
                )
              }
            >
              recuperar casilla
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-neutral-400">
            <span>Fuerza de voluntad</span>
            <span>
              {sheet.willpowerCur}/{sheet.willpowerMax}
            </span>
          </div>
          <div className="mt-2 h-3 border border-neutral-700 sharp-border-inner bg-black">
            <motion.div
              className="h-full bg-[var(--terminal)]/80"
              style={{ boxShadow: "inset 0 0 10px rgba(57,255,20,0.5)" }}
              animate={{ width: `${wpPct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              className="text-[10px] uppercase text-neutral-400 hover:text-[var(--blood)]"
              onClick={() =>
                onChange(
                  {
                    ...sheet,
                    willpowerCur: Math.max(0, sheet.willpowerCur - 1),
                  },
                  sheetLocked ? `Voluntad gastada (${sheet.willpowerCur - 1}/${sheet.willpowerMax})` : undefined,
                )
              }
            >
              gastar WP
            </button>
            <button
              type="button"
              className="text-[10px] uppercase text-neutral-400 hover:text-[var(--terminal)]"
              onClick={() =>
                onChange(
                  {
                    ...sheet,
                    willpowerCur: Math.min(sheet.willpowerMax, sheet.willpowerCur + 1),
                  },
                  sheetLocked ? `Voluntad recuperada (${sheet.willpowerCur + 1}/${sheet.willpowerMax})` : undefined,
                )
              }
            >
              recuperar WP
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-neutral-400">
            <span>Hambre</span>
            <span>{sheet.hunger}</span>
          </div>
          {hungerInteractive ? (
            <input
              type="range"
              min={0}
              max={5}
              value={sheet.hunger}
              onChange={(e) =>
                onChange(
                  { ...sheet, hunger: Number(e.target.value) },
                  sheetLocked
                    ? `Narrador ajustó Hambre a ${Number(e.target.value)}`
                    : undefined,
                )
              }
              className="mt-2 w-full accent-[var(--blood)]"
            />
          ) : (
            <p className="mt-2 text-[10px] text-neutral-600">
              Ritmo dictado por el Reloj Mnemósine — sólo el Narrador reescribe estos índices.
            </p>
          )}
          <div className="mt-1 flex gap-px font-mono text-[13px]" style={{ color: "var(--blood)" }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i}>{i <= sheet.hunger ? "●" : "○"}</span>
            ))}
          </div>
          {isNarrator && sheetLocked && (
            <button
              type="button"
              className="mt-3 w-full border border-neutral-700 py-2 text-[10px] uppercase tracking-widest text-[var(--terminal)] sharp-border-inner hover:bg-[var(--terminal)]/10"
              onClick={() =>
                onChange({ ...sheet, hunger: 0 }, "Alimentarse — Narrador puso Hambre en 0")
              }
            >
              Alimentarse (reset Hambre)
            </button>
          )}
        </div>
      </div>

      {(sheetLocked || xpLog.length > 0) && (
        <div className="mt-auto flex min-h-[8rem] flex-col border border-neutral-800 bg-black/55 p-2 font-mono text-[10px] text-neutral-500 sharp-border-inner">
          <p className="mb-2 text-[9px] uppercase tracking-[0.3em] text-neutral-600">Bitácora Mnemósine</p>
          <div className="max-h-40 overflow-y-auto space-y-1 pr-1 text-neutral-400">
            {xpLog.slice(-40).length === 0 ? (
              <span className="text-neutral-600">Sin registros auditoría.</span>
            ) : (
              xpLog
                .slice(-40)
                .map((line, i) => (
                  <p key={`${line.ts}-${i}-${line.text.slice(0, 16)}`}>{line.text}</p>
                ))
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
