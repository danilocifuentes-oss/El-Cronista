"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CLAN_OPTIONS, type CharacterSheet } from "@/lib/character";
import { NexusLibrary } from "@/components/icons/NexusLibrary";
import {
  disciplineLabel,
  disciplineTooltip,
  getActiveDisciplineKeys,
  type DisciplineKey,
} from "@/lib/sereno";

type BeastLabelKey = "identity" | "hunger" | "integrity" | "disciplines";

const BEAST_WORDS = ["CARNE", "CONSUMIR", "SANGRE", "CEDER", "VACÍO", "HUNDIR"] as const;

type Props = {
  accent: string;
  sheet: CharacterSheet;
  /** Amenaza Σ ciudad (0–5) — sincronizada con mesa / AdminConsole. */
  citySigma: number;
  healthFilled: number;
  healthMax: number;
  hunger: number;
  onEidolonVault: () => void;
  onCodex: () => void;
  onLogout: () => void;
};

function DisciplineGlyph({ k, className }: { k: DisciplineKey; className?: string }) {
  const c = className ?? "h-7 w-7";
  switch (k) {
    case "animalism":
      return <NexusLibrary.Vastago className={c} color="var(--terminal)" />;
    case "auspex":
      return <NexusLibrary.Cronista className={c} />;
    case "blood_sorcery":
      return <NexusLibrary.Sangre className={c} />;
    case "celerity":
      return <NexusLibrary.Circuit className={c} />;
    case "dominate":
      return <NexusLibrary.Inquisicion sigma={1} className={c} />;
    case "fortitude":
      return <NexusLibrary.Destino className={c} />;
    case "obfuscate":
      return <NexusLibrary.Circuit className={c} />;
    case "potence":
      return <NexusLibrary.Inquisicion sigma={4} className={c} />;
    case "presence":
      return <NexusLibrary.Inquisicion sigma={2} className={c} />;
    case "protean":
      return <NexusLibrary.Vastago className={c} color="var(--terminal)" />;
    default:
      return <NexusLibrary.Cronista className={c} />;
  }
}

function clanLabel(clan: CharacterSheet["clan"]): string {
  return CLAN_OPTIONS.find((o) => o.id === clan)?.label ?? clan;
}

function generationTag(gen: CharacterSheet["generation"]): string {
  const g = String(gen).toUpperCase();
  return g.replace(/_/g, "·");
}

export function SidebarMesa({
  accent,
  sheet,
  citySigma,
  healthFilled,
  healthMax,
  hunger,
  onEidolonVault,
  onCodex,
  onLogout,
}: Props) {
  const reduceMotion = useReducedMotion();
  const prevHealth = useRef(healthFilled);
  const [damageShake, setDamageShake] = useState(false);
  const [beastFlash, setBeastFlash] = useState<{ key: BeastLabelKey; word: string } | null>(null);

  const h = Math.max(0, Math.min(5, hunger));
  const hf = Math.max(0, Math.min(healthMax, healthFilled));
  const sigma = Math.max(0, Math.min(5, Math.round(citySigma)));

  const disciplineKeys = getActiveDisciplineKeys(sheet.clan, sheet.caitiffDisciplinePicks);

  useEffect(() => {
    if (healthFilled < prevHealth.current && !reduceMotion) {
      setDamageShake(true);
      const t = window.setTimeout(() => setDamageShake(false), 480);
      prevHealth.current = healthFilled;
      return () => window.clearTimeout(t);
    }
    prevHealth.current = healthFilled;
  }, [healthFilled, reduceMotion]);

  const beastClearRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (h < 5 || reduceMotion) {
      setBeastFlash(null);
      return;
    }
    const id = window.setInterval(() => {
      const keys: BeastLabelKey[] = ["identity", "hunger", "integrity", "disciplines"];
      const key = keys[Math.floor(Math.random() * keys.length)]!;
      const word = BEAST_WORDS[Math.floor(Math.random() * BEAST_WORDS.length)]!;
      setBeastFlash({ key, word });
      if (beastClearRef.current !== undefined) window.clearTimeout(beastClearRef.current);
      beastClearRef.current = window.setTimeout(() => {
        beastClearRef.current = undefined;
        setBeastFlash(null);
      }, 75 + Math.random() * 100);
    }, 1600);
    return () => {
      window.clearInterval(id);
      if (beastClearRef.current !== undefined) window.clearTimeout(beastClearRef.current);
    };
  }, [h, reduceMotion]);

  function labelFor(key: BeastLabelKey, normal: string): string {
    if (beastFlash?.key === key) return beastFlash.word;
    return normal;
  }

  return (
    <aside
      className="sticky top-0 hidden min-h-0 w-[min(16rem,100%)] shrink-0 flex-col border-r border-white/[0.06] bg-void bg-[linear-gradient(180deg,rgba(5,5,5,0.97),rgba(12,12,16,0.98))] font-mono xl:flex xl:max-h-none"
      aria-label="Terminal mesa SchreckNet"
    >
      <div
        className={`flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 ${damageShake && !reduceMotion ? "nexo-sidebar-shake-once" : ""}`}
      >
        {/* IDENTIDAD · CODEX */}
        <section className="space-y-2">
          <div
            className={`flex items-center gap-2 text-[color:var(--terminal)]/70 ${beastFlash?.key === "identity" ? "nexo-beast-label-glitch text-[color:var(--blood)]" : ""}`}
          >
            <NexusLibrary.Vastago className="h-4 w-4 shrink-0" />
            <span className="text-[10px] uppercase tracking-[0.2em]">
              {labelFor("identity", "Sujeto_Identificado")}
            </span>
          </div>
          <div
            className="rounded-sm border border-white/[0.1] bg-white/[0.02] p-3"
            style={{ boxShadow: `${accent}12 0 0 0 1px inset` }}
          >
            <h3 className="font-sans text-lg font-bold uppercase tracking-tighter text-neutral-200">
              {sheet.name?.trim() || "Sin_nombre"}
            </h3>
            <p className="text-[10px] uppercase tracking-widest text-[color:var(--terminal)]/60">
              {clanLabel(sheet.clan)} // Gen_{generationTag(sheet.generation)}
            </p>
          </div>
        </section>

        {/* SIGNOS VITALES */}
        <section className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] uppercase tracking-widest text-neutral-500">
              <span
                className={
                  beastFlash?.key === "hunger"
                    ? "nexo-beast-label-glitch font-bold text-[color:var(--blood)]"
                    : h > 3
                      ? "text-[color:var(--blood)]"
                      : ""
                }
              >
                {labelFor("hunger", "Vitae_Hunger")}
              </span>
              <span className={h > 3 ? "animate-pulse text-[color:var(--blood)]" : ""}>
                {h}/5
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={`hunger-${i}`}
                  className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                    i < h ? "bg-[color:var(--blood)] shadow-[0_0_5px_var(--blood)]" : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[9px] uppercase tracking-widest text-neutral-500">
              <span
                className={
                  beastFlash?.key === "integrity"
                    ? "nexo-beast-label-glitch font-bold text-[color:var(--blood)]"
                    : ""
                }
              >
                {labelFor("integrity", "Integridad_Física")}
              </span>
              <span>
                {hf}/{healthMax}
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={false}
                animate={{ width: `${healthMax > 0 ? (hf / healthMax) * 100 : 0}%` }}
                transition={{ type: "spring", stiffness: 280, damping: 28 }}
                className="h-full rounded-full bg-[color:var(--terminal)] shadow-[0_0_8px_var(--terminal-op-40)]"
              />
            </div>
          </div>
        </section>

        {/* DISCIPLINAS_CARGADAS */}
        <section className="space-y-2">
          <p
            className={`text-[9px] uppercase tracking-[0.28em] text-neutral-600 ${
              beastFlash?.key === "disciplines" ? "nexo-beast-label-glitch text-[color:var(--blood)]" : ""
            }`}
          >
            {labelFor("disciplines", "//_Disciplinas_Cargadas")}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {disciplineKeys.map((dk) => {
              const dots = Math.max(0, Math.round(sheet.disciplines[dk] ?? 0));
              const corrupt = dots === 0;
              const tip = disciplineTooltip(dk);
              return (
                <div
                  key={dk}
                  title={`${disciplineLabel(dk)} · ${dots} — ${tip}`}
                  className="flex flex-col items-center gap-1 rounded border border-white/[0.06] bg-black/40 px-1.5 py-2"
                >
                  <div
                    className={`relative flex h-9 w-9 items-center justify-center ${corrupt ? "nexo-disc-corrupt" : ""}`}
                  >
                    <DisciplineGlyph k={dk} className="h-8 w-8" />
                    {corrupt ? (
                      <span className="pointer-events-none absolute bottom-0 font-mono text-[6px] uppercase tracking-tighter text-red-400/90">
                        NULL
                      </span>
                    ) : null}
                  </div>
                  <span className="max-w-full truncate text-center text-[7px] uppercase tracking-wide text-neutral-500">
                    {disciplineLabel(dk).slice(0, 9)}
                  </span>
                  <span className="text-[9px] tabular-nums text-[color:var(--terminal)]/80">{dots}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[7px] leading-snug text-neutral-600">
            Pasivos: vigilancia / canal. Activos: mandato σ · circuito · destino sangrado.
          </p>
        </section>

        <nav className="flex flex-col gap-2 border-t border-white/[0.06] pt-3">
          <button
            type="button"
            onClick={onCodex}
            className="rounded-lg border border-zinc-800/90 bg-black/50 px-2.5 py-2.5 text-left font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-300 transition hover:border-[color:var(--neon)]/35 hover:text-white"
            style={{ borderColor: `${accent}2a` }}
          >
            Hoja CODEX
          </button>
          <button
            type="button"
            onClick={onEidolonVault}
            className="rounded-lg border border-zinc-800 bg-black/40 px-2.5 py-2.5 text-left font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400 transition hover:border-[color:var(--blood)]/25 hover:text-neutral-100"
            title="Elegir otra lápida entre tus envolturas"
          >
            Cripta del Elíseo
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="mt-1 rounded-lg border border-[var(--blood)]/30 px-2.5 py-2 text-left font-sans text-[9px] font-medium uppercase tracking-[0.2em] text-[var(--blood)] transition hover:bg-[var(--blood)]/10"
          >
            Salir del Nexo
          </button>
        </nav>

        {/* MONITOR CIUDAD · Σ */}
        <section className="mt-auto space-y-3 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <NexusLibrary.Inquisicion
                sigma={sigma}
                className={`h-8 w-8 shrink-0 ${sigma > 3 ? "nexo-glyph-sigma-pulse" : ""}`}
              />
              <span className="text-[10px] uppercase tracking-widest text-neutral-400">Alerta_Σ</span>
            </div>
            <span
              className={`shrink-0 text-[11px] font-bold ${sigma > 3 ? "text-[color:var(--blood)]" : "text-[color:var(--terminal)]"}`}
            >
              LEVEL_{sigma}
            </span>
          </div>
          {sigma > 3 ? (
            <motion.div
              animate={reduceMotion ? undefined : { opacity: [1, 0.45, 1] }}
              transition={reduceMotion ? undefined : { repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
              className="border border-[color:var(--blood)]/30 bg-[color:var(--blood)]/10 p-2 text-[9px] uppercase text-[color:var(--blood)]"
            >
              Interferencia detectada: Protocolo Silencio activado.
            </motion.div>
          ) : null}
        </section>
      </div>
    </aside>
  );
}
