"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  CLAN_ACCENTS,
  CLAN_OPTIONS,
  type CharacterSheet,
  type ClanId,
  defaultSkills,
  DISCIPLINE_KEYS,
  SKILL_KEYS,
} from "@/lib/character";
import { DotTrack } from "./DotTrack";

type Props = {
  initial: CharacterSheet;
  onSave: (sheet: CharacterSheet) => void;
};

const ATTR_LABELS: { key: keyof CharacterSheet["attributes"]; label: string }[] = [
  { key: "str", label: "Fuerza" },
  { key: "dex", label: "Destreza" },
  { key: "sta", label: "Resistencia" },
  { key: "cha", label: "Carisma" },
  { key: "man", label: "Manip." },
  { key: "com", label: "Compostura" },
  { key: "int", label: "Intelecto" },
  { key: "wit", label: "Astucia" },
  { key: "res", label: "Resolución" },
];

export function CharacterCreation({ initial, onSave }: Props) {
  const [sheet, setSheet] = useState<CharacterSheet>(() => ({
    ...initial,
    attributes: { ...initial.attributes },
    skills: { ...defaultSkills(), ...initial.skills },
    disciplines: { ...initial.disciplines },
  }));

  const accent = CLAN_ACCENTS[sheet.clan];

  const setAttr = (key: keyof CharacterSheet["attributes"], v: number) => {
    setSheet((s) => ({ ...s, attributes: { ...s.attributes, [key]: v } }));
  };

  const setSkill = (key: string, v: number) => {
    setSheet((s) => ({ ...s, skills: { ...s.skills, [key]: v } }));
  };

  const setDisc = (key: string, v: number) => {
    setSheet((s) => ({ ...s, disciplines: { ...s.disciplines, [key]: v } }));
  };

  return (
    <div className="min-h-screen p-6 md:p-10 crt-wrap">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-4xl space-y-6"
      >
        <header
          className="sharp-border-inner border-neutral-700 bg-neutral-950/90 p-6"
          style={{ borderLeftColor: accent, borderLeftWidth: 4 }}
        >
          <h2 className="font-sans text-2xl font-semibold tracking-tight text-neutral-100">
            Generador de progenie
          </h2>
          <p className="mt-2 font-mono text-xs text-[var(--terminal)]/90">
            Registro inicial — el clan redefine la firma del terminal
          </p>
        </header>

        <section className="sharp-border-inner border-neutral-800 bg-neutral-950/80 p-6">
          <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--blood)]">Perfil</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase text-neutral-500">Nombre / alias</label>
              <input
                value={sheet.name}
                onChange={(e) => setSheet((s) => ({ ...s, name: e.target.value }))}
                className="mt-1 w-full border border-neutral-700 bg-black/80 px-3 py-2 font-mono text-sm text-neutral-200 sharp-border-inner"
              />
            </div>
            <div>
              <label className="text-xs uppercase text-neutral-500">Clan</label>
              <select
                value={sheet.clan}
                onChange={(e) => setSheet((s) => ({ ...s, clan: e.target.value as ClanId }))}
                className="mt-1 w-full border border-neutral-700 bg-black/80 px-3 py-2 font-mono text-sm text-neutral-200 sharp-border-inner"
              >
                {CLAN_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase text-neutral-500">Concepto</label>
              <input
                value={sheet.concept}
                onChange={(e) => setSheet((s) => ({ ...s, concept: e.target.value }))}
                className="mt-1 w-full border border-neutral-700 bg-black/80 px-3 py-2 font-sans text-sm text-neutral-200 sharp-border-inner"
              />
            </div>
          </div>
        </section>

        <section className="sharp-border-inner border-neutral-800 bg-neutral-950/80 p-6">
          <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--terminal)]">
            Atributos (1–5)
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ATTR_LABELS.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-2">
                <span className="font-mono text-xs text-neutral-400">{label}</span>
                <DotTrack accent={accent} min={1} value={sheet.attributes[key]} onChange={(v) => setAttr(key, v)} />
              </div>
            ))}
          </div>
        </section>

        <section className="sharp-border-inner border-neutral-800 bg-neutral-950/80 p-6">
          <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--terminal)]">
            Habilidades
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {SKILL_KEYS.map((sk) => (
              <div key={sk} className="flex flex-col gap-2">
                <span className="font-sans text-sm text-neutral-300">{sk}</span>
                <DotTrack accent={accent} max={5} value={sheet.skills[sk] ?? 0} onChange={(v) => setSkill(sk, v)} />
              </div>
            ))}
          </div>
        </section>

        <section className="sharp-border-inner border-neutral-800 bg-neutral-950/80 p-6">
          <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--blood)]">
            Disciplinas
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {DISCIPLINE_KEYS.map((d) => (
              <div key={d} className="flex flex-col gap-2">
                <span className="font-sans text-sm text-neutral-300">{d}</span>
                <DotTrack accent={accent} max={5} value={sheet.disciplines[d] ?? 0} onChange={(v) => setDisc(d, v)} />
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-4 pb-16">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSave(sheet)}
            className="border px-10 py-3 font-mono text-sm font-bold uppercase tracking-[0.2em] text-black sharp-border-inner"
            style={{
              borderColor: accent,
              boxShadow: `inset 0 0 20px ${accent}44`,
              backgroundImage: `linear-gradient(145deg, var(--terminal), ${accent})`,
            }}
          >
            Sellar ficha en memoria local
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
