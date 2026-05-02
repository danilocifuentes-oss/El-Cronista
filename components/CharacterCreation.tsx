"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  CLAN_ACCENTS,
  CLAN_OPTIONS,
  type CharacterSheet,
  type ClanId,
  type SkillDistributionMode,
  type Generation,
  defaultSkills,
  defaultDisciplines,
  clanDefaultCaitiffPicks,
  ATTRIBUTE_KEYS,
} from "@/lib/character";
import type { DisciplineKey } from "@/lib/sereno";
import {
  SERENO_SKILLS,
  DISCIPLINE_POOL,
  validateAttributeSpread,
  validateSkillSpread,
  validateDisciplines,
  bloodPotencyForGeneration,
  getActiveDisciplineKeys,
  disciplineLabel,
  disciplineTooltip,
  RESONANCE_OPTIONS,
  TOOLTIP_HUMANITY,
  TOOLTIP_RESONANCE,
} from "@/lib/sereno";
import { DotTrack } from "./DotTrack";
import { SerenoFooter } from "./SerenoFooter";

type Props = {
  initial: CharacterSheet;
  onSave: (sheet: CharacterSheet) => void;
};

export function CharacterCreation({ initial, onSave }: Props) {
  const [sheet, setSheet] = useState<CharacterSheet>(() => ({
    ...initial,
    attributes: { ...initial.attributes },
    skills: { ...defaultSkills(), ...initial.skills },
    disciplines: { ...defaultDisciplines(), ...initial.disciplines },
    caitiffDisciplinePicks:
      initial.caitiffDisciplinePicks ??
      (initial.clan === "caitiff" || initial.clan === "other"
        ? clanDefaultCaitiffPicks(initial.clan)
        : null),
  }));
  const [triedSeal, setTriedSeal] = useState(false);

  const accent = CLAN_ACCENTS[sheet.clan];
  const clanLabel = CLAN_OPTIONS.find((c) => c.id === sheet.clan)?.label ?? sheet.clan;

  const activeDiscKeys = useMemo(
    () => getActiveDisciplineKeys(sheet.clan, sheet.caitiffDisciplinePicks),
    [sheet.clan, sheet.caitiffDisciplinePicks],
  );

  const attrOk = !validateAttributeSpread(sheet.attributes);
  const skillOk = !validateSkillSpread(sheet.skills, sheet.skillMode);
  const discOk = !validateDisciplines(sheet.disciplines, sheet.clan, sheet.generation, sheet.caitiffDisciplinePicks);

  function applyGeneration(gen: Generation) {
    setSheet((s) => ({ ...s, generation: gen, bloodPotency: bloodPotencyForGeneration(gen) }));
  }

  function setClan(cid: ClanId) {
    setSheet((s) => ({
      ...s,
      clan: cid,
      caitiffDisciplinePicks: cid === "caitiff" || cid === "other" ? clanDefaultCaitiffPicks(cid) : null,
      disciplines: { ...defaultDisciplines() },
    }));
  }

  function setPickSlot(index: 0 | 1 | 2, key: DisciplineKey) {
    setSheet((s) => {
      if (s.clan !== "caitiff" && s.clan !== "other") return s;
      const cur =
        s.caitiffDisciplinePicks ??
        ([...clanDefaultCaitiffPicks(s.clan)] as [DisciplineKey, DisciplineKey, DisciplineKey]);
      const next: [DisciplineKey, DisciplineKey, DisciplineKey] = [...cur];
      next[index] = key;
      const fresh = defaultDisciplines();
      for (const pk of next) fresh[pk] = s.disciplines[pk] ?? 0;
      return { ...s, caitiffDisciplinePicks: next, disciplines: fresh };
    });
  }

  function seal() {
    setTriedSeal(true);
    const picks =
      sheet.clan === "caitiff" || sheet.clan === "other"
        ? (sheet.caitiffDisciplinePicks ?? clanDefaultCaitiffPicks(sheet.clan))
        : null;
    if (picks && new Set(picks).size !== 3) return;
    if (
      validateAttributeSpread(sheet.attributes) ||
      validateSkillSpread(sheet.skills, sheet.skillMode) ||
      validateDisciplines(sheet.disciplines, sheet.clan, sheet.generation, sheet.caitiffDisciplinePicks)
    ) {
      return;
    }
    onSave({
      ...sheet,
      bloodPotency: bloodPotencyForGeneration(sheet.generation),
    });
  }

  function setAttr(key: keyof CharacterSheet["attributes"], v: number) {
    setSheet((s) => ({ ...s, attributes: { ...s.attributes, [key]: v } }));
  }

  function setSkill(key: string, v: number) {
    setSheet((s) => ({ ...s, skills: { ...s.skills, [key]: v } }));
  }

  function setDisc(key: DisciplineKey, v: number) {
    setSheet((s) => ({ ...s, disciplines: { ...s.disciplines, [key]: v } }));
  }

  const ring = (ok: boolean) =>
    triedSeal && !ok ? "ring-1 ring-[var(--blood)]/90 ring-offset-0 ring-offset-[#050505]" : "";

  const caitiffEff =
    sheet.clan === "caitiff" || sheet.clan === "other"
      ? sheet.caitiffDisciplinePicks ?? clanDefaultCaitiffPicks(sheet.clan)
      : activeDiscKeys;

  const inputBase =
    "w-full border border-[#161616] bg-black/55 px-2.5 py-2 font-mono text-[11px] text-neutral-300 focus:outline-none focus:ring-1 focus:ring-[var(--clan-accent)] focus:ring-offset-0 focus:ring-offset-[#050505]";

  return (
    <div
      className="codex-dot-grid crt-wrap min-h-screen pb-20 text-neutral-300"
      style={{ ["--clan-accent"]: accent } as React.CSSProperties}
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-6xl space-y-5 px-5 py-8 md:px-8">
        <header className="border-b border-[#161616] pb-5 font-mono">
          <p className="text-[9px] uppercase tracking-[0.35em] text-neutral-600">CODEX_V</p>
          <h1 className="mt-1 text-sm font-normal tracking-[0.12em] text-neutral-400">Construcción de matriz Cainita cerrada.</h1>
        </header>

        <section className="divide-y divide-[#161616] border border-[#161616] bg-black/20">
          <div className="px-4 py-3 font-mono text-[9px] uppercase tracking-[0.28em] text-neutral-600">{"//_META"}</div>
          <div className="grid gap-4 p-4 md:grid-cols-12">
            <div className="md:col-span-4">
              <label className="text-[9px] uppercase tracking-widest text-neutral-600">&gt;_OPERADOR</label>
              <input
                value={sheet.name}
                onChange={(e) => setSheet((s) => ({ ...s, name: e.target.value }))}
                className={`${inputBase} mt-2`}
              />
            </div>
            <div className="md:col-span-4">
              <label className="text-[9px] uppercase tracking-widest text-neutral-600">&gt;_LINAJE</label>
              <select
                value={sheet.clan}
                onChange={(e) => setClan(e.target.value as ClanId)}
                className={`${inputBase} mt-2 cursor-pointer`}
              >
                {CLAN_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <p
                className={`mt-2 font-mono text-[11px] ${sheet.antitribu ? "line-through decoration-neutral-500 decoration-2" : ""}`}
                style={{ color: accent }}
              >
                {clanLabel}
              </p>
            </div>
            <label className="flex items-center gap-2 md:col-span-4 md:self-end">
              <input
                type="checkbox"
                checked={sheet.antitribu}
                onChange={(e) => setSheet((s) => ({ ...s, antitribu: e.target.checked }))}
                style={{ accentColor: accent }}
              />
              <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">
                [ANOMALÍA_LINAJE]
              </span>
            </label>

            <div className="md:col-span-12">
              <label className="text-[9px] uppercase tracking-widest text-neutral-600">&gt;_SIGNIFIER</label>
              <input
                value={sheet.concept}
                onChange={(e) => setSheet((s) => ({ ...s, concept: e.target.value }))}
                className={`${inputBase} mt-2`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 md:col-span-12 md:border-t md:border-[#161616] md:pt-4">
              <span className="text-[9px] text-neutral-600">GENERACIÓN</span>
              <label className="flex cursor-pointer items-center gap-2 font-mono text-[10px]">
                <input type="radio" checked={sheet.generation === "neonato"} onChange={() => applyGeneration("neonato")} />
                NEONATO
              </label>
              <label className="flex cursor-pointer items-center gap-2 font-mono text-[10px]">
                <input type="radio" checked={sheet.generation === "ancilla"} onChange={() => applyGeneration("ancilla")} />
                ANCILLA
              </label>
              <span className="hidden h-3 w-px bg-[#161616] sm:block" aria-hidden />
              <span className="text-[9px] text-neutral-600">DIST_VEC</span>
              <label className="flex cursor-pointer items-center gap-2 font-mono text-[10px]">
                <input
                  type="radio"
                  checked={sheet.skillMode === "jack"}
                  onChange={() => setSheet((s) => ({ ...s, skillMode: "jack" as SkillDistributionMode }))}
                />
                JACK
              </label>
              <label className="flex cursor-pointer items-center gap-2 font-mono text-[10px]">
                <input
                  type="radio"
                  checked={sheet.skillMode === "specialist"}
                  onChange={() =>
                    setSheet((s) => ({ ...s, skillMode: "specialist" as SkillDistributionMode }))
                  }
                />
                ESPEC
              </label>
              <span className="font-mono text-[10px] text-neutral-500">PS:{sheet.bloodPotency}</span>
              <span className="flex items-center gap-2" title={TOOLTIP_HUMANITY}>
                <span className="text-[9px] uppercase text-neutral-600">ANIMA</span>
                <DotTrack
                  min={1}
                  max={10}
                  value={sheet.humanity}
                  accent={accent}
                  minimal={false}
                  onChange={(v) => setSheet((s) => ({ ...s, humanity: v }))}
                />
              </span>
              <label className="flex items-center gap-2 font-mono text-[10px] text-neutral-500" title={TOOLTIP_RESONANCE}>
                <span className="text-[9px] uppercase text-neutral-600">SIGN</span>
                <select
                  value={sheet.resonance}
                  onChange={(e) => setSheet((s) => ({ ...s, resonance: e.target.value }))}
                  className={`${inputBase} !w-auto`}
                >
                  <option value="">—</option>
                  {RESONANCE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-3">
          <section className={`border border-[#161616] bg-black/25 ${ring(attrOk)}`}>
            <h2 className="border-b border-[#161616] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.32em] text-neutral-600">
              {"//_ATRIBUTOS"}
            </h2>
            <div className="space-y-3 p-4">
              {ATTRIBUTE_KEYS.map((a) => (
                <div key={a.key} className="flex items-center justify-between gap-4">
                  <span title={a.tooltip} className="cursor-help font-mono text-[10px] tracking-tight text-neutral-500">
                    {a.label}
                  </span>
                  <DotTrack
                    min={1}
                    max={4}
                    accent={accent}
                    minimal={false}
                    value={sheet.attributes[a.key]}
                    onChange={(v) => setAttr(a.key, v)}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className={`max-h-[72vh] border border-[#161616] bg-black/25 lg:max-h-none ${ring(skillOk)}`}>
            <h2 className="border-b border-[#161616] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.32em] text-neutral-600">
              {"//_HABILIDADES"}
            </h2>
            <div className="max-h-[60vh] space-y-2.5 overflow-y-auto p-4 lg:max-h-[calc(100vh-220px)]">
              {SERENO_SKILLS.map(({ key, label, tooltip }) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span title={tooltip} className="cursor-help truncate font-mono text-[10px] text-neutral-500">
                    {label}
                  </span>
                  <DotTrack max={3} accent={accent} minimal={false} value={sheet.skills[key] ?? 0} onChange={(v) => setSkill(key, v)} />
                </div>
              ))}
            </div>
          </section>

          <section className={`border border-[#161616] bg-black/25 ${ring(discOk)}`}>
            <h2 className="border-b border-[#161616] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.32em] text-neutral-600">
              {"//_PODERES"}
            </h2>
            <div className="space-y-3 p-4">
              {(sheet.clan === "caitiff" || sheet.clan === "other") && (
                <div className="grid gap-2">
                  {([0, 1, 2] as const).map((slot) => (
                    <select
                      key={slot}
                      value={caitiffEff[slot]}
                      onChange={(e) => setPickSlot(slot, e.target.value as DisciplineKey)}
                      className={`${inputBase} cursor-pointer`}
                    >
                      {DISCIPLINE_POOL.map((d) => (
                        <option key={d.key} value={d.key}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  ))}
                </div>
              )}
              {activeDiscKeys.map((k) => (
                <div key={k} className="flex items-center justify-between gap-2">
                  <span title={disciplineTooltip(k)} className="cursor-help font-mono text-[10px] text-neutral-500">
                    {disciplineLabel(k)}
                  </span>
                  <DotTrack
                    max={2}
                    accent={accent}
                    minimal={false}
                    value={(sheet.disciplines[k] as number) ?? 0}
                    onChange={(v) => setDisc(k, v)}
                  />
                </div>
              ))}

              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={seal}
                className="mt-6 w-full border bg-black py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.28em]"
                style={{ borderColor: accent, color: accent, boxShadow: `inset 0 0 0 1px ${accent}22` }}
              >
                &gt;_SELLAR_CODEX
              </motion.button>
            </div>
          </section>
        </div>
      </motion.div>
      <SerenoFooter />
    </div>
  );
}
