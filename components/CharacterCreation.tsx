"use client";

import { motion } from "framer-motion";
import { useMemo, useState, type CSSProperties } from "react";
import {
  CLAN_ACCENTS,
  CLAN_OPTIONS,
  ATTRIBUTE_BANDS,
  ATTRIBUTE_KEYS,
  type CharacterSheet,
  type ClanId,
  type SkillDistributionMode,
  type Generation,
  defaultSkills,
  defaultDisciplines,
  clanDefaultCaitiffPicks,
  emptySheet,
  normalizeCharacterSheet,
  CHARGEN_ATTRIBUTE_DOT_BASE,
  CHARGEN_HUMANITY_BASE,
  willpowerMaxFromAttributes,
} from "@/lib/character";
import type { DisciplineKey } from "@/lib/sereno";
import {
  SERENO_SKILLS,
  SKILL_LANE_LABEL,
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
  TOOLTIP_FREEBIE_POOL,
  type SkillLane,
} from "@/lib/sereno";
import {
  ATRIBUTOS_SCHEMA,
  classicAttrPresetCaption,
  classicSkillPresetCaption,
  HABILIDADES_SCHEMA,
  summarizeClassicTotals,
  validateClassicAttributeSpread,
  validateClassicDisciplineSpread,
  validateClassicSkillSpread,
} from "@/lib/serenoClassic";
import { fusionChargenProfile } from "@/lib/fusionTimeline";
import { CONCEPTOS_DATA, inferConceptPresetIdFromNombre } from "@/lib/conceptosCodex";
import { ConceptCodexField } from "./ConceptCodexField";
import { DotTrack } from "./DotTrack";
import { SerenoFooter } from "./SerenoFooter";

/** Freebies CODEX ocultos en creación hasta rediseño de ese bloque. */
const SHOW_CODEX_FREEBIES = false;

const TOOLTIP_DIST_VEC =
  "Sólo motor Sereno V5: cómo repartir el 1–3 puntos entre las 27 habilidades antes de mejoras. JACK: patrón de generalista cerrado por el equipo. ESPECIALISTA: más dados al máximo (3 puntos); menosprecio en el resto.";
const TOOLTIP_BLOOD_SUFFIX = "Poder de sangre (V5). Subir con ANCILLA o reglas mesa.";
const TOOLTIP_CONCEPTO =
  "Resumen jugable en una línea quién es el personaje (rol, oficio visible, cliché)—no lore largo.";
const TEXTO_SUMA_DISC = (motor: string, actual: number, meta: number, maxDot: number) =>
  `${motor}: llevas ${actual} de ${meta} puntos entre las tres disciplinas de tu clan. Como mucho ${maxDot} puntos en una misma disciplina al crear la ficha.`;

type Props = {
  initial: CharacterSheet;
  onSave: (sheet: CharacterSheet) => void;
};

export function CharacterCreation({ initial, onSave }: Props) {
  const [sheet, setSheet] = useState<CharacterSheet>(() => ({
    ...initial,
    conceptPresetId: ((): string | null => {
      if (initial.conceptPresetId === null) return null;
      if (
        typeof initial.conceptPresetId === "string" &&
        CONCEPTOS_DATA.some((c) => c.id === initial.conceptPresetId)
      ) {
        return initial.conceptPresetId;
      }
      return inferConceptPresetIdFromNombre(initial.concept ?? "") ?? null;
    })(),
    freebiePool: initial.freebiePool ?? 21,
    chargenMotor: initial.chargenMotor ?? "v5_sereno",
    classicAttrPreset: initial.classicAttrPreset ?? 0,
    classicSkillPreset: initial.classicSkillPreset ?? 0,
    yearsUnlife:
      typeof initial.yearsUnlife === "number" && initial.yearsUnlife >= 0 ? Math.floor(initial.yearsUnlife) : 12,
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

  const discDotsSum = useMemo(
    () => activeDiscKeys.reduce((s, k) => s + ((sheet.disciplines[k] as number) ?? 0), 0),
    [activeDiscKeys, sheet.disciplines],
  );

  const classicMode = sheet.chargenMotor === "classic_rev";
  const timeline = useMemo(
    () =>
      fusionChargenProfile({
        clan: sheet.clan,
        yearsUnlife: sheet.yearsUnlife,
        generation: sheet.generation,
      }),
    [sheet.clan, sheet.generation, sheet.yearsUnlife],
  );
  const attrOk = classicMode
    ? !validateClassicAttributeSpread(sheet.attributes, sheet.classicAttrPreset)
    : !validateAttributeSpread(sheet.attributes);
  const skillOk = classicMode
    ? !validateClassicSkillSpread(sheet.skills, sheet.classicSkillPreset)
    : !validateSkillSpread(sheet.skills, sheet.skillMode);
  const discOk = classicMode
    ? !validateClassicDisciplineSpread(sheet.disciplines, sheet.clan, sheet.caitiffDisciplinePicks, {
        budget: timeline.classicDisciplineBudget,
        maxPer: timeline.classicMaxPerDot,
      })
    : !validateDisciplines(sheet.disciplines, sheet.clan, sheet.generation, sheet.caitiffDisciplinePicks, {
        budget: timeline.v5DisciplineBudget,
        maxPerDot: timeline.v5MaxPerDot,
      });

  const classicSums = useMemo(
    () => (classicMode ? summarizeClassicTotals(sheet) : null),
    [classicMode, sheet],
  );

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
    const attrErr = classicMode
      ? validateClassicAttributeSpread(sheet.attributes, sheet.classicAttrPreset)
      : validateAttributeSpread(sheet.attributes);
    const skillErr = classicMode
      ? validateClassicSkillSpread(sheet.skills, sheet.classicSkillPreset)
      : validateSkillSpread(sheet.skills, sheet.skillMode);
    const discErr = classicMode
      ? validateClassicDisciplineSpread(sheet.disciplines, sheet.clan, sheet.caitiffDisciplinePicks, {
          budget: timeline.classicDisciplineBudget,
          maxPer: timeline.classicMaxPerDot,
        })
      : validateDisciplines(sheet.disciplines, sheet.clan, sheet.generation, sheet.caitiffDisciplinePicks, {
          budget: timeline.v5DisciplineBudget,
          maxPerDot: timeline.v5MaxPerDot,
        });
    if (attrErr || skillErr || discErr) return;
    onSave({
      ...sheet,
      bloodPotency: bloodPotencyForGeneration(sheet.generation),
    });
  }

  function setAttr(key: keyof CharacterSheet["attributes"], v: number) {
    setSheet((s) => {
      const nextAttrs = { ...s.attributes, [key]: v };
      const wpMax = willpowerMaxFromAttributes(nextAttrs);
      return {
        ...s,
        attributes: nextAttrs,
        willpowerMax: wpMax,
        willpowerCur: Math.min(s.willpowerCur, wpMax),
      };
    });
  }

  function setSkill(key: string, v: number) {
    setSheet((s) => ({ ...s, skills: { ...s.skills, [key]: v } }));
  }

  function setDisc(key: DisciplineKey, v: number) {
    setSheet((s) => ({ ...s, disciplines: { ...s.disciplines, [key]: v } }));
  }

  function resetToBlankCodex() {
    if (
      !window.confirm(
        "¿Plantilla CODEX en cero? Borra operador, concepto y todo el reparto de puntos hasta el estado base (atributos sólo en punto gris, habilidades ○). Ignora el borrador en memoria; lo guardado en el Nexo no cambia hasta volver a sellar.",
      )
    ) {
      return;
    }
    const blank = normalizeCharacterSheet(emptySheet());
    setSheet({
      ...blank,
      skills: { ...defaultSkills() },
      disciplines: { ...defaultDisciplines() },
      caitiffDisciplinePicks:
        blank.clan === "caitiff" || blank.clan === "other"
          ? clanDefaultCaitiffPicks(blank.clan)
          : null,
    });
    setTriedSeal(false);
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
      style={{ ["--clan-accent"]: accent } as CSSProperties}
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-6xl space-y-5 px-5 py-8 md:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#161616] pb-5 font-mono">
          <div>
            <p className="text-[9px] uppercase tracking-[0.35em] text-neutral-600">CODEX_V</p>
            <h1 className="mt-1 text-sm font-normal tracking-[0.12em] text-neutral-400">Matriz Cainita</h1>
          </div>
          <button
            type="button"
            onClick={resetToBlankCodex}
            title="Descarta borrador actual y fuerza plantilla CODEX inicial (sin leer KV)."
            className="shrink-0 border border-[#2a2a2a] bg-black/40 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-500 hover:border-neutral-600 hover:text-neutral-400"
          >
            [NUEVA_MATRIZ]
          </button>
        </header>

        <section className="divide-y divide-[#161616] border border-[#161616] bg-black/20">
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

            <ConceptCodexField
              concept={sheet.concept}
              conceptPresetId={sheet.conceptPresetId}
              onPatch={(p) =>
                setSheet((s) => ({
                  ...s,
                  ...p,
                }))
              }
              inputBase={inputBase}
              labelTooltip={TOOLTIP_CONCEPTO}
            />

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 md:col-span-12 md:border-t md:border-[#161616] md:pt-4">
              <span className="text-[9px] text-neutral-600">MOTOR CODEX</span>
              <label className="flex cursor-pointer items-center gap-2 font-mono text-[10px]">
                <input
                  type="radio"
                  checked={sheet.chargenMotor === "v5_sereno"}
                  onChange={() => setSheet((s) => ({ ...s, chargenMotor: "v5_sereno" }))}
                />
                SERENO V5 (cliente)
              </label>
              <label className="flex cursor-pointer items-center gap-2 font-mono text-[10px]">
                <input
                  type="radio"
                  checked={sheet.chargenMotor === "classic_rev"}
                  onChange={() => setSheet((s) => ({ ...s, chargenMotor: "classic_rev" }))}
                />
                REVISED (fusión papel)
              </label>
              <span className="hidden h-3 w-px bg-[#161616] sm:block" aria-hidden />
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
              <span className="text-[9px] text-neutral-600" title={TOOLTIP_DIST_VEC}>
                HABIL. V5
              </span>
              <label
                className={`flex cursor-pointer items-center gap-2 font-mono text-[10px] ${classicMode ? "opacity-35" : ""}`}
                title={TOOLTIP_DIST_VEC}
              >
                <input
                  type="radio"
                  disabled={classicMode}
                  checked={sheet.skillMode === "jack"}
                  onChange={() => setSheet((s) => ({ ...s, skillMode: "jack" as SkillDistributionMode }))}
                />
                JACK
              </label>
              <label
                className={`flex cursor-pointer items-center gap-2 font-mono text-[10px] ${classicMode ? "opacity-35" : ""}`}
                title={TOOLTIP_DIST_VEC}
              >
                <input
                  type="radio"
                  disabled={classicMode}
                  checked={sheet.skillMode === "specialist"}
                  onChange={() =>
                    setSheet((s) => ({ ...s, skillMode: "specialist" as SkillDistributionMode }))
                  }
                />
                ESPEC
              </label>
              <span className="font-mono text-[10px] text-neutral-500" title={TOOLTIP_BLOOD_SUFFIX}>
                PS:{sheet.bloodPotency}
              </span>
              <span className="flex items-center gap-2" title={TOOLTIP_HUMANITY}>
                <span className="text-[9px] uppercase text-neutral-600">ANIMA</span>
                <DotTrack
                  min={1}
                  max={10}
                  value={sheet.humanity}
                  accent={accent}
                  minimal={false}
                  baselineFilled={CHARGEN_HUMANITY_BASE}
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

            {SHOW_CODEX_FREEBIES && (
              <div
                className="md:col-span-12 md:border-t md:border-[#161616] md:pt-4"
                title={TOOLTIP_FREEBIE_POOL}
              >
                <label className="text-[9px] uppercase tracking-widest text-neutral-600">{"//_FREEBIES"}</label>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={sheet.freebiePool}
                    onChange={(e) =>
                      setSheet((s) => ({
                        ...s,
                        freebiePool: Math.max(0, Math.min(999, Number(e.target.value) || 0)),
                      }))
                    }
                    className={`${inputBase} max-w-[6rem]`}
                  />
                  <p className="max-w-xl font-mono text-[8px] leading-relaxed text-neutral-600">
                    {classicMode
                      ? "Modo Revised: reparto monetario sobre base atributo 1, habilidades 0–5, 13/9/5 permutable, disciplinas línea suman 3. Freebies siguen sólo cuenta en cliente."
                      : "REF papel: selecciona «REVISED» arriba para validar 7/5/3 · 13/9/5 ahí; motor Sereno usa 4·3⁴·2³·1 + JACK/ESPEC."}{" "}
                    {!classicMode && (
                      <span className="text-neutral-500">Distribución V5: 4·3⁴·2³·1 + JACK/ESPEC.</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {classicMode && (
              <div className="grid gap-4 p-4 md:grid-cols-12 md:border-t md:border-[#161616]">
                <div className="md:col-span-6">
                  <label className="text-[9px] uppercase tracking-widest text-neutral-600">
                    {"//_AGRUP_BANDA_ATTR (P=dots +7,S=+5,T=+3 sobre base 1)"}
                  </label>
                  <select
                    value={sheet.classicAttrPreset}
                    onChange={(e) =>
                      setSheet((s) => ({ ...s, classicAttrPreset: Number(e.target.value) }))
                    }
                    className={`${inputBase} mt-2 cursor-pointer`}
                  >
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <option key={i} value={i}>
                        {i}: {classicAttrPresetCaption(i)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-6">
                  <label className="text-[9px] uppercase tracking-widest text-neutral-600">
                    {"//_AGRUP_CARRILES_HAB (total 13·9·5 por permutación)"}
                  </label>
                  <select
                    value={sheet.classicSkillPreset}
                    onChange={(e) =>
                      setSheet((s) => ({ ...s, classicSkillPreset: Number(e.target.value) }))
                    }
                    className={`${inputBase} mt-2 cursor-pointer`}
                  >
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <option key={i} value={i}>
                        {i}: {classicSkillPresetCaption(i)}
                      </option>
                    ))}
                  </select>
                </div>
                {classicSums != null && (
                  <div className="font-mono text-[9px] leading-relaxed text-neutral-500 md:col-span-12">
                    &gt;_EXCESOS_ATTR → P:{classicSums.attrs.primary}/{ATRIBUTOS_SCHEMA.primary} · S:
                    {classicSums.attrs.secondary}/{ATRIBUTOS_SCHEMA.secondary} · T:{classicSums.attrs.tertiary}/
                    {ATRIBUTOS_SCHEMA.tertiary}
                    {" // _HABILIDADES_RAW → "}
                    P:{classicSums.skills.primary}/{HABILIDADES_SCHEMA.primary} · S:
                    {classicSums.skills.secondary}/{HABILIDADES_SCHEMA.secondary} · T:{classicSums.skills.tertiary}/{HABILIDADES_SCHEMA.tertiary}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-3">
          <p className="font-mono text-[8px] leading-snug text-neutral-600 lg:col-span-3">
            Leyenda CODEX creación· Atributos:{" "}
            <span className="text-neutral-500">{CHARGEN_ATTRIBUTE_DOT_BASE} ● gris = base automática cada estadística.</span>{" "}
            <span style={{ color: accent }}>● color de linaje</span>
            {" = "}puntos extra que vos asignás. Habilidades inician ○ hasta repartir. ANIMA:{" "}
            <span className="text-neutral-500">{CHARGEN_HUMANITY_BASE} ● gris</span>
            {" + "}
            <span style={{ color: accent }}>color clan</span>
            {" = "}por encima de esa base hasta sellar.
          </p>

          <section className={`border border-[#161616] bg-black/25 ${ring(attrOk)}`}>
            <h2 className="border-b border-[#161616] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.32em] text-neutral-600">
              {"//_ATRIBUTOS"}
            </h2>
            <div className="space-y-5 p-4">
              {ATTRIBUTE_BANDS.map((band) => (
                <div key={band.label}>
                  <p className="mb-2 font-mono text-[8px] uppercase tracking-[0.28em] text-neutral-700">{band.label}</p>
                  <div className="space-y-3">
                    {band.keys.map((key) => {
                      const a = ATTRIBUTE_KEYS.find((x) => x.key === key)!;
                      return (
                        <div key={key} className="flex items-center justify-between gap-4">
                          <span
                            title={a.tooltip}
                            className="cursor-help font-mono text-[10px] tracking-tight text-neutral-500"
                          >
                            {a.label}
                          </span>
                          <DotTrack
                            min={1}
                            max={classicMode ? 5 : 4}
                            accent={accent}
                            minimal={false}
                            baselineFilled={CHARGEN_ATTRIBUTE_DOT_BASE}
                            value={sheet.attributes[key]}
                            onChange={(v) => setAttr(key, v)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={`max-h-[72vh] border border-[#161616] bg-black/25 lg:max-h-none ${ring(skillOk)}`}>
            <h2 className="border-b border-[#161616] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.32em] text-neutral-600">
              {"//_HABILIDADES"}
            </h2>
            <div className="max-h-[60vh] space-y-5 overflow-y-auto p-4 lg:max-h-[calc(100vh-220px)]">
              {(["talento", "tecnica", "conocimiento"] as const as readonly SkillLane[]).map((lane) => (
                <div key={lane}>
                  <p className="mb-2 font-mono text-[8px] uppercase tracking-[0.28em] text-neutral-700">
                    {SKILL_LANE_LABEL[lane]}
                  </p>
                  <div className="space-y-2.5">
                    {SERENO_SKILLS.filter((s) => s.lane === lane).map(({ key, label, tooltip }) => (
                      <div key={key} className="flex items-center justify-between gap-2">
                        <span title={tooltip} className="cursor-help truncate font-mono text-[10px] text-neutral-500">
                          {label}
                        </span>
                        <DotTrack
                          max={classicMode ? 5 : 3}
                          accent={accent}
                          minimal={false}
                          value={sheet.skills[key] ?? 0}
                          onChange={(v) => setSkill(key, v)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={`border border-[#161616] bg-black/25 ${ring(discOk)}`}>
            <h2 className="border-b border-[#161616] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.32em] text-neutral-600">
              {"//_PODERES"}
            </h2>
            <p className="border-b border-[#161616] px-3 py-1 font-mono text-[8px] leading-snug text-neutral-500">
              {TEXTO_SUMA_DISC(
                classicMode ? "Modo Revised (papel)" : "Modo Sereno V5",
                discDotsSum,
                classicMode ? timeline.classicDisciplineBudget : timeline.v5DisciplineBudget,
                classicMode ? timeline.classicMaxPerDot : timeline.v5MaxPerDot,
              )}
            </p>
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
                    max={classicMode ? timeline.classicMaxPerDot : timeline.v5MaxPerDot}
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
