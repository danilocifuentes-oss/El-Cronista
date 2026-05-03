"use client";

import { motion } from "framer-motion";
import { CLAN_ACCENTS, CLAN_OPTIONS } from "@/lib/character";
import type { ProfileSummary } from "@/lib/profileStore";

type Props = {
  profiles: ProfileSummary[];
  onPlayProfile: (id: string) => void;
  onNewSheetBlank: () => void;
  onLogout: () => void;
};

export function ProfileHub({ profiles, onPlayProfile, onNewSheetBlank, onLogout }: Props) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#050505] px-4 py-10 font-mono text-neutral-300 crt-wrap techno-grid">
      <div className="mx-auto w-full max-w-lg space-y-8">
        <header className="space-y-2 border-b border-[#161616] pb-6">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--terminal)]/90">SCHRECK_NET</p>
          <h1 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-200">Índice de operadores</h1>
          <p className="text-[10px] leading-relaxed text-neutral-600">
            Elige un personaje guardado en este dispositivo, crea uno nuevo en blanco o vuelve al login para otra
            sesión. Cada perfil conserva hoja, bitácora y auditoría por separado (MVP local).
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.99 }}
            onClick={onNewSheetBlank}
            className="border border-[var(--terminal)]/40 bg-neutral-950/80 px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.28em] text-[var(--terminal)] sharp-border-inner hover:bg-[var(--terminal)]/10"
          >
            + Tabla en blanco
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.99 }}
            onClick={onLogout}
            className="border border-[var(--blood)]/40 px-4 py-2.5 text-[9px] uppercase tracking-[0.25em] text-[var(--blood)]/90 hover:bg-[var(--blood)]/10"
          >
            Volver al login
          </motion.button>
        </div>

        <section className="space-y-3">
          <p className="text-[9px] uppercase tracking-[0.32em] text-neutral-600">Personajes guardados</p>
          {profiles.length === 0 ? (
            <p className="border border-[#161616] bg-black/40 px-4 py-6 text-[10px] text-neutral-600">
              [VACÍO] · Usa «Tabla en blanco» para abrir el CODEX sin datos previos.
            </p>
          ) : (
            <ul className="space-y-2">
              {profiles.map((p) => {
                const accent = CLAN_ACCENTS[p.clan];
                const clanLabel = CLAN_OPTIONS.find((c) => c.id === p.clan)?.label ?? p.clan;
                return (
                  <li key={p.id}>
                    <motion.button
                      type="button"
                      whileHover={{ x: 2 }}
                      onClick={() => onPlayProfile(p.id)}
                      className="flex w-full items-center justify-between gap-3 border border-[#1a1a1a] bg-black/50 px-4 py-3 text-left sharp-border-inner transition-colors hover:border-[#2a2a2a]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-sans text-xs text-neutral-200">{p.name}</span>
                        <span className="mt-0.5 block text-[9px] tracking-wide text-neutral-600" style={{ color: accent }}>
                          {clanLabel}
                        </span>
                      </span>
                      <span className="shrink-0 text-[8px] uppercase tracking-widest text-neutral-600">Entrar →</span>
                    </motion.button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
