"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CharacterSheet } from "@/lib/character";
import { CLAN_ACCENTS, CLAN_OPTIONS } from "@/lib/character";
import { NexusLibrary } from "@/components/icons/NexusLibrary";

type Props = {
  sheet: CharacterSheet;
  isNarrator?: boolean;
};

const HEALTH_MAX = 7;

/** Eco vital de la hoja: sólo lectura; los cambios vienen de la crónica, CODEX o motor de mesa. */
export function CharacterStatusPanel({ sheet, isNarrator = false }: Props) {
  const reduceMotion = useReducedMotion();
  const accent = CLAN_ACCENTS[sheet.clan];
  const wpPct = sheet.willpowerMax ? (sheet.willpowerCur / sheet.willpowerMax) * 100 : 0;
  const linajeLabel = CLAN_OPTIONS.find((c) => c.id === sheet.clan)?.label ?? sheet.clan;

  const filledIntegrity = HEALTH_MAX - Math.min(sheet.healthDamage, HEALTH_MAX);
  const h = Math.max(0, Math.min(5, sheet.hunger));
  const vitaeHot = h >= 3;
  const vitaeShellClass =
    h <= 1
      ? "border-white/[0.07] bg-black/35"
      : vitaeHot
        ? `border-[color:var(--crimson)]/35 bg-[color:var(--blood)]/[0.07] ${reduceMotion ? "" : "nexo-vitae-shell"}`
        : `border-white/[0.08] bg-black/40 ${reduceMotion ? "" : "nexo-vitae-shell--calm"}`;

  return (
    <aside className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto border-[#161616] bg-black/24 p-3 font-mono text-[10px] text-neutral-500 lg:w-60 lg:shrink-0">
      <header className="border-b border-[#161616] pb-3">
        <p className="text-[8px] uppercase tracking-[0.28em] text-neutral-600">Eco vital</p>
        <p className="mt-1 font-sans text-[9px] leading-snug text-neutral-600">
          Estado de tu hoja en este instante. Lo que gasta o recupera la escena aparece cuando el canal lo registra.
        </p>
      </header>

      <section className="space-y-2" title="Marcas de integridad física recuperables">
        <div className="flex items-center justify-between text-[8px] uppercase tracking-[0.22em] text-neutral-600">
          <span>Integridad</span>
          <span className="tabular-nums text-neutral-500">
            {filledIntegrity}/{HEALTH_MAX}
          </span>
        </div>
        <div className="flex flex-wrap gap-1" aria-hidden>
          {Array.from({ length: HEALTH_MAX }, (_, i) => (
            <span
              key={`su-${i}`}
              className={`h-2 w-2 rounded-full ${
                i < filledIntegrity
                  ? "bg-emerald-500/85 shadow-[0_0_8px_rgba(16,185,129,0.25)]"
                  : "border border-emerald-950/50 bg-transparent"
              }`}
            />
          ))}
        </div>
      </section>

      <section className="space-y-2" title="Voluntad actual / máximo">
        <div className="flex items-center justify-between text-[8px] uppercase tracking-[0.22em] text-neutral-600">
          <span>Voluntad</span>
          <span className="tabular-nums text-neutral-400">
            {sheet.willpowerCur}/{sheet.willpowerMax}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full border border-[#1a1a1a] bg-black/80">
          <motion.div
            className="h-full rounded-full bg-[color:var(--terminal)]/75"
            initial={false}
            animate={{ width: `${wpPct}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 24 }}
          />
        </div>
      </section>

      <section
        className={`relative overflow-hidden rounded-xl px-3 py-3 ${vitaeShellClass}`}
        aria-label={`Presión de Vitae ${h} de 5`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(159,18,57,0.12),transparent_55%)]" aria-hidden />
        <div className="relative flex items-start gap-2.5">
          <NexusLibrary.Sangre className={`h-9 w-9 shrink-0 ${vitaeHot && !reduceMotion ? "nexo-glyph-blood-pulse" : ""}`} pulse={h > 2 && !reduceMotion} />
          <div className="min-w-0 flex-1">
            <p className="text-[8px] uppercase tracking-[0.26em] text-[color:var(--blood)]/90">Presión Vitae</p>
            <p className="mt-0.5 font-sans text-2xl font-light tabular-nums leading-none text-neutral-100">
              {h}
              <span className="text-base text-neutral-600">/5</span>
            </p>
            <p className="mt-1.5 text-[8px] leading-snug text-neutral-600">
              {h >= 4 ? "La Bestia oprime el canal." : h >= 2 ? "Eco hematófago perceptible." : "Reservas relativamente serenas."}
            </p>
          </div>
        </div>
        <div className="relative mt-3 flex gap-1">
          {Array.from({ length: 5 }, (_, i) => {
            const on = i < h;
            return (
              <div
                key={`h-${i}`}
                className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                  on
                    ? `bg-gradient-to-b from-[color:var(--crimson)] to-[color:var(--blood)] ${
                        vitaeHot && !reduceMotion ? "nexo-vitae-segment-fill" : "shadow-[0_0_6px_rgba(159,18,57,0.35)]"
                      }`
                    : "bg-white/[0.06]"
                }`}
              />
            );
          })}
        </div>
      </section>

      {isNarrator ? (
        <p className="border-t border-[#161616] pt-3 text-[8px] leading-relaxed text-neutral-700" style={{ color: accent }}>
          <span className="font-sans font-medium text-neutral-400">{sheet.name || "—"}</span>
          <span className="text-neutral-600"> · </span>
          <span>{linajeLabel}</span>
          <span className="mt-2 block text-neutral-600">
            Pot. sangre {sheet.bloodPotency} · Humanidad {sheet.humanity}
            {sheet.freebiePool > 0 ? ` · Puntos libres ${sheet.freebiePool}` : null}
            {sheet.resonance ? ` · Resonancia ${sheet.resonance}` : null}
          </span>
        </p>
      ) : null}
    </aside>
  );
}
