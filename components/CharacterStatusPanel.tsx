"use client";

import { motion } from "framer-motion";
import type { CharacterSheet } from "@/lib/character";
import { CLAN_ACCENTS, CLAN_OPTIONS } from "@/lib/character";

type Props = {
  sheet: CharacterSheet;
  onChange: (next: CharacterSheet, logLine?: string) => void;
  sheetLocked?: boolean;
  isNarrator?: boolean;
  /** Solo lectura: sin ajustes tácticos (vista ampliada eventual). */
  readOnlyMode?: boolean;
};

const HEALTH_MAX = 7;

export function CharacterStatusPanel({
  sheet,
  onChange,
  sheetLocked = false,
  isNarrator = false,
  readOnlyMode = false,
}: Props) {
  const accent = CLAN_ACCENTS[sheet.clan];
  const wpPct = sheet.willpowerMax ? (sheet.willpowerCur / sheet.willpowerMax) * 100 : 0;
  const hungerInteractive = readOnlyMode ? false : sheetLocked ? isNarrator : true;
  const linajeLabel = CLAN_OPTIONS.find((c) => c.id === sheet.clan)?.label ?? sheet.clan;

  return (
    <aside className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto border-[#161616] bg-black/24 p-3 font-mono text-[10px] text-neutral-500 lg:w-60 lg:shrink-0">
      {/* SU/SV táctico; transfondo sólo en Codex */}
      <div className="border-b border-[#161616] pb-4">
        <div title="Índice de integridad física (no salud audible)">
          {readOnlyMode ? (
            <p className="text-[9px] text-neutral-600">
              SU · daño {sheet.healthDamage} / {HEALTH_MAX}
            </p>
          ) : (
            <div className="mb-2 flex gap-4 text-neutral-600">
              <button
                type="button"
                className="hover:text-emerald-500/90"
                onClick={() =>
                  onChange({ ...sheet, healthDamage: Math.min(HEALTH_MAX, sheet.healthDamage + 1) }, `[SU_DELTA]:−1`)
                }
              >
                ◇−
              </button>
              <button
                type="button"
                className="hover:text-emerald-500/90"
                onClick={() =>
                  onChange({ ...sheet, healthDamage: Math.max(0, sheet.healthDamage - 1) }, `[SU_DELTA]:+1`)
                }
              >
                ◇+
              </button>
            </div>
          )}
        </div>

        <div title="Capacidad ejecutiva temporal">
          <div className="flex justify-between text-neutral-700">
            <span>WV</span>
            <span>
              {sheet.willpowerCur}/{sheet.willpowerMax}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 border border-[#161616] bg-black">
            <motion.div
              className="h-full bg-[var(--terminal)]/70"
              animate={{ width: `${wpPct}%` }}
              transition={{ stiffness: 180, damping: 22 }}
            />
          </div>
          {!readOnlyMode ? (
            <div className="mt-2 flex gap-4 text-neutral-600">
              <button type="button" className="hover:text-neutral-400" onClick={() => onChange({ ...sheet, willpowerCur: Math.max(0, sheet.willpowerCur - 1) }, `[WV_DELTA]:−1`)}>
                −
              </button>
              <button
                type="button"
                className="hover:text-neutral-400"
                onClick={() =>
                  onChange(
                    { ...sheet, willpowerCur: Math.min(sheet.willpowerMax, sheet.willpowerCur + 1) },
                    `[WV_DELTA]:+1`,
                  )
                }
              >
                +
              </button>
            </div>
          ) : null}
        </div>

        <div title="Vector hematófago — intervalo servidor local">
          {hungerInteractive ? (
            <input
              type="range"
              min={0}
              max={5}
              value={sheet.hunger}
              onChange={(e) =>
                onChange(
                  { ...sheet, hunger: Number(e.target.value) },
                  sheetLocked ? `[H_VECTOR]:=${Number(e.target.value)}` : undefined,
                )
              }
              className="mt-2 w-full accent-[var(--blood)]"
            />
          ) : (
            <p className="mt-2 text-[9px] text-neutral-500">Hambre {sheet.hunger}/5</p>
          )}
          {!readOnlyMode && isNarrator && sheetLocked ? (
            <button
              type="button"
              className="mt-2 w-full border border-[#161616] py-1.5 text-[9px] uppercase tracking-widest text-[var(--terminal)] hover:bg-neutral-950"
              onClick={() => onChange({ ...sheet, hunger: 0 }, `[H_RESET]:0`)}
            >
              H₀
            </button>
          ) : null}
        </div>
      </div>

      {isNarrator ? (
        <p className="text-[8px] leading-relaxed text-neutral-700" style={{ color: accent }}>
          {sheet.name || "—"} · {linajeLabel}
          <span className="mt-2 block font-mono tabular-nums text-neutral-600">
            PS{sheet.bloodPotency}_HUM{sheet.humanity}_FB{sheet.freebiePool}_{sheet.resonance?.slice(0, 3) || "—"}
          </span>
        </p>
      ) : null}
    </aside>
  );
}
