"use client";

import { motion } from "framer-motion";
import type { CharacterSheet } from "@/lib/character";
import { CLAN_ACCENTS, CLAN_OPTIONS } from "@/lib/character";
import type { XpLogEntry } from "@/lib/sessionMeta";

type Props = {
  sheet: CharacterSheet;
  onChange: (next: CharacterSheet, logLine?: string) => void;
  xpLog?: XpLogEntry[];
  sheetLocked?: boolean;
  isNarrator?: boolean;
  /** Solo lectura: sin ajustes tácticos (vista hoja ampliada). */
  readOnlyMode?: boolean;
};

const HEALTH_MAX = 7;

export function CharacterStatusPanel({
  sheet,
  onChange,
  xpLog = [],
  sheetLocked = false,
  isNarrator = false,
  readOnlyMode = false,
}: Props) {
  const accent = CLAN_ACCENTS[sheet.clan];
  const wpPct = sheet.willpowerMax ? (sheet.willpowerCur / sheet.willpowerMax) * 100 : 0;
  const hungerInteractive = readOnlyMode ? false : sheetLocked ? isNarrator : true;
  const linajeLabel = CLAN_OPTIONS.find((c) => c.id === sheet.clan)?.label ?? sheet.clan;

  return (
    <aside className="flex h-full flex-col gap-5 border-[#161616] bg-black/30 p-3 font-mono text-[10px] text-neutral-500 lg:w-64 lg:shrink-0">
      <div>
        <p className="text-[9px] uppercase tracking-[0.38em] text-neutral-700">{"//_OPERADOR"}</p>
        <p className="mt-2 font-sans text-sm tracking-tight text-neutral-300">{sheet.name || "—"}</p>
        <p className={`mt-1 text-[10px] ${sheet.antitribu ? "line-through opacity-55" : ""}`} style={{ color: accent }}>
          {linajeLabel}
        </p>
        <p className="mt-2 text-[9px] text-neutral-600">
          PS{sheet.bloodPotency}_HUM{sheet.humanity}_FB{sheet.freebiePool}_{sheet.resonance?.slice(0, 3) || "—"}
        </p>
      </div>

      {/* SU/SV táctico — texto mínimo; integridad física reflejada en HUD */}
      <div className="space-y-5 border-y border-[#161616] py-4">
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
            <motion.div className="h-full bg-[var(--terminal)]/70" animate={{ width: `${wpPct}%` }} transition={{ stiffness: 180, damping: 22 }} />
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
          ) : readOnlyMode ? (
            <p className="mt-2 text-[9px] text-neutral-500">Σh {sheet.hunger}/5</p>
          ) : (
            <p className="text-[9px] leading-snug opacity-65">[&gt;_CLOCK_READONLY]</p>
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

      {(sheetLocked || xpLog.length > 0) && (
        <div className="mt-auto flex min-h-[6rem] flex-col border border-[#161616] bg-black/40 p-2">
          <p className="mb-1.5 text-[8px] uppercase tracking-[0.35em] text-neutral-700">{"//_AUDIT"}</p>
          <div className="max-h-36 space-y-0.5 overflow-y-auto pr-1 text-[9px] leading-relaxed text-neutral-500">
            {xpLog.slice(-40).length === 0 ? (
              <span className="text-neutral-700">[VACÍO]</span>
            ) : (
              xpLog.slice(-40).map((line, i) => (
                <p key={`${line.ts}-${i}-${line.text.slice(0, 12)}`}>{line.text}</p>
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
