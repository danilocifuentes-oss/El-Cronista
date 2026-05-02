"use client";

import { motion } from "framer-motion";
import type { CharacterSheet } from "@/lib/character";
import { CLAN_ACCENTS } from "@/lib/character";

type Props = {
  sheet: CharacterSheet;
  onChange: (s: CharacterSheet) => void;
};

const HEALTH_MAX = 7;

export function CharacterStatusPanel({ sheet, onChange }: Props) {
  const accent = CLAN_ACCENTS[sheet.clan];
  const healthFilled = HEALTH_MAX - Math.min(sheet.healthDamage, HEALTH_MAX);
  const wpPct = sheet.willpowerMax ? (sheet.willpowerCur / sheet.willpowerMax) * 100 : 0;

  return (
    <aside className="flex h-full flex-col gap-6 border-neutral-800 bg-neutral-950/90 sharp-border-inner p-4 lg:w-72 lg:shrink-0">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--terminal)]">
          Estado
        </p>
        <h2 className="mt-2 font-sans text-lg font-semibold text-neutral-100">{sheet.name || "Sin nombre"}</h2>
        <p className="font-mono text-xs text-neutral-500">
          {sheet.clan} · {sheet.concept}
        </p>
      </div>

      <div className="space-y-4 font-mono text-xs">
        <div>
          <div className="flex justify-between text-neutral-400">
            <span>Salud ({healthFilled}/{HEALTH_MAX})</span>
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
          <button
            type="button"
            className="mt-2 text-[10px] uppercase tracking-widest text-[var(--blood)] hover:underline"
            onClick={() =>
              onChange({
                ...sheet,
                healthDamage: Math.min(HEALTH_MAX, sheet.healthDamage + 1),
              })
            }
          >
            +daño superficial
          </button>
          <button
            type="button"
            className="ml-3 mt-2 text-[10px] uppercase tracking-widest text-[var(--terminal)] hover:underline"
            onClick={() =>
              onChange({
                ...sheet,
                healthDamage: Math.max(0, sheet.healthDamage - 1),
              })
            }
          >
            recuperar casilla
          </button>
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
                onChange({
                  ...sheet,
                  willpowerCur: Math.max(0, sheet.willpowerCur - 1),
                })
              }
            >
              gastar WP
            </button>
            <button
              type="button"
              className="text-[10px] uppercase text-neutral-400 hover:text-[var(--terminal)]"
              onClick={() =>
                onChange({
                  ...sheet,
                  willpowerCur: Math.min(sheet.willpowerMax, sheet.willpowerCur + 1),
                })
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
          <input
            type="range"
            min={0}
            max={5}
            value={sheet.hunger}
            onChange={(e) => onChange({ ...sheet, hunger: Number(e.target.value) })}
            className="mt-2 w-full accent-[var(--blood)]"
          />
          <div className="mt-1 flex gap-px font-mono text-[13px]" style={{ color: "var(--blood)" }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i}>{i <= sheet.hunger ? "●" : "○"}</span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
