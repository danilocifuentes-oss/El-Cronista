"use client";

import { motion } from "framer-motion";
import { CLAN_ACCENTS, CLAN_OPTIONS } from "@/lib/character";
import type { ProfileSummary } from "@/lib/profileStore";
import { phaseToHref } from "@/lib/schreckNavigation";

type Props = {
  profiles: ProfileSummary[];
  /** Carga el CV y entra al Nexo (desde ahí se abre la Campaña Solitaria). */
  onPlayProfile: (id: string) => void;
  onNewSheetBlank: () => void;
  onLogout: () => void;
  /** Vacía el registro de personajes en este navegador (no remoto; conserva Génesis y conversación Nexo). */
  onClearLocalProfiles: () => void;
};

/** Solo personajes de jugador en el registro (NPC quedan en Centro de Mando / narrador). */
function playerProfiles(list: ProfileSummary[]) {
  return list.filter((p) => p.isNPC !== true);
}

export function ProfileHub({
  profiles,
  onPlayProfile,
  onNewSheetBlank,
  onLogout,
  onClearLocalProfiles,
}: Props) {
  const visible = playerProfiles(profiles);
  return (
    <div className="relative flex min-h-screen flex-col bg-[#050505] px-4 py-10 font-mono text-neutral-300 crt-wrap techno-grid">
      <div className="mx-auto w-full max-w-lg space-y-8">
        <header className="space-y-4 border-b border-[#161616] pb-6">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--terminal)]/90">SCHRECK_NET</p>
          <h1 className="font-sans text-lg font-semibold tracking-tight text-neutral-100">Registro SCHRECK_CV</h1>
          <p className="text-[11px] leading-relaxed text-neutral-500">
            Elige un personaje para entrar al <span className="text-neutral-400">Nexo</span> (canal, manifestar voluntad,
            digest de continuidad). Desde ahí abre la{" "}
            <span className="text-neutral-400">crónica solitaria</span> con el botón homónimo en la barra lateral o en el
            menú móvil. Si ya tienes sesión y personaje activo, puedes usar el atajo{" "}
            <code className="rounded border border-neutral-800 bg-black/60 px-1 py-px text-[10px] text-neutral-400">
              {phaseToHref("soloCampaign")}
            </code>
            .
          </p>
          <div className="relative overflow-hidden border border-[#1c1c1c] bg-gradient-to-r from-black/80 via-[#0a0a0a] to-black/80 px-3 py-2.5 sharp-border-inner">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, transparent, transparent 2px, var(--terminal) 2px, var(--terminal) 3px)",
              }}
            />
            <div className="relative flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--terminal)]/40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--terminal)]/90" />
              </span>
              <p className="text-[9px] uppercase tracking-[0.28em] text-neutral-500">CV · campaña local · por perfil</p>
            </div>
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.99 }}
            onClick={onNewSheetBlank}
            className="border border-[var(--terminal)]/40 bg-neutral-950/80 px-5 py-2.5 text-[9px] font-semibold uppercase tracking-[0.28em] text-[var(--terminal)] sharp-border-inner hover:bg-[var(--terminal)]/10"
          >
            Nuevo personaje
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.99 }}
            onClick={onLogout}
            className="border border-[var(--blood)]/40 px-4 py-2.5 text-[9px] uppercase tracking-[0.25em] text-[var(--blood)]/90 hover:bg-[var(--blood)]/10"
          >
            Volver al login
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.99 }}
            onClick={() => {
              if (
                !window.confirm(
                  "¿Borrar todos los personajes guardados en ESTE equipo? No borra la Génesis ni el chat Nexo; sólo el registro local de fichas.",
                )
              )
                return;
              if (!window.confirm("Confirmación final: se pierden las fichas locales listadas abajo.")) return;
              onClearLocalProfiles();
            }}
            className="border border-amber-900/50 px-4 py-2.5 text-[9px] uppercase tracking-[0.22em] text-amber-200/90 hover:bg-amber-950/30"
          >
            Borrar personajes locales
          </motion.button>
        </div>

        <section className="space-y-3">
          <p className="text-[9px] uppercase tracking-[0.32em] text-neutral-600">Personajes disponibles</p>
          {visible.length === 0 ? (
            <p className="border border-[#161616] bg-black/40 px-4 py-8 text-center text-[11px] leading-relaxed text-neutral-500">
              Aquí aparecerán tus personajes. Pulsa{" "}
              <span className="text-[var(--terminal)]/90">«Nuevo personaje»</span> para abrir el CODEX y sellar tu primera
              ficha.
            </p>
          ) : (
            <ul className="space-y-2">
              {visible.map((p) => {
                const accent = CLAN_ACCENTS[p.clan];
                const clanLabel = CLAN_OPTIONS.find((c) => c.id === p.clan)?.label ?? p.clan;
                return (
                  <li key={p.id}>
                    <div className="flex w-full items-center justify-between gap-3 border border-[#1a1a1a] bg-black/50 px-4 py-3 text-left sharp-border-inner transition-colors hover:border-[#2a2a2a]">
                      <span className="min-w-0">
                        <span className="block truncate font-sans text-xs text-neutral-200">
                          {p.isNPC ? (
                            <span className="mr-2 inline-block border border-[#b91c1c]/50 px-1 py-px text-[8px] uppercase tracking-wider text-[#b91c1c]/90">
                              NPC
                            </span>
                          ) : null}
                          {p.name}
                        </span>
                        <span className="mt-0.5 block text-[9px] tracking-wide text-neutral-600" style={{ color: accent }}>
                          {clanLabel}
                        </span>
                      </span>
                      <motion.button
                        type="button"
                        whileHover={{ x: 2 }}
                        onClick={() => onPlayProfile(p.id)}
                        className="shrink-0 border border-[var(--terminal)]/40 px-3 py-1.5 text-[8px] uppercase tracking-widest text-[var(--terminal)] hover:bg-[var(--terminal)]/10"
                      >
                        Entrar al Nexo
                      </motion.button>
                    </div>
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
