"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  CLAN_ACCENTS,
  CLAN_OPTIONS,
  ATTRIBUTE_BANDS,
  ATTRIBUTE_KEYS,
  type CharacterSheet,
  type ClanId,
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
  classicAttrPresetChoicesForClan,
  classicAttrPresetSummary,
  classicSkillPresetSummary,
  coerceClassicAttrPresetForClan,
  HABILIDADES_SCHEMA,
  summarizeClassicTotals,
  validateClassicAttributeSpread,
  validateClassicDisciplineSpread,
  validateClassicSkillSpread,
} from "@/lib/serenoClassic";
import { fusionChargenProfile } from "@/lib/fusionTimeline";
import { generateRandomCodexMatrix } from "@/lib/codexRandomMatrix";
import {
  codexAllowsAttributeDots,
  codexAllowsDisciplineDots,
  codexAllowsSkillDots,
  codexMaxAttributeDots,
  codexMaxDisciplineDots,
  codexMaxSkillDots,
  codexRejectHintAttribute,
  codexRejectHintDiscipline,
  codexRejectHintSkill,
} from "@/lib/codexChargenGuards";
import { CONCEPTOS_DATA, inferConceptPresetIdFromNombre } from "@/lib/conceptosCodex";
import { ConceptCodexField } from "./ConceptCodexField";
import { DotTrack } from "./DotTrack";
/** Freebies CODEX ocultos en creación hasta rediseño de ese bloque. */
const SHOW_CODEX_FREEBIES = false;

function AllocationMeters({
  accent,
  title,
  rows,
}: {
  accent: string;
  title: string;
  rows: { label: string; cur: number; max: number }[];
}) {
  return (
    <div className="rounded-md border border-neutral-800/50 bg-black/30 px-4 py-3">
      <p className="mb-3 text-[8px] font-medium uppercase tracking-[0.22em] text-neutral-600">{title}</p>
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        {rows.map((x) => {
          const pct = x.max > 0 ? Math.min(100, (x.cur / x.max) * 100) : 0;
          return (
            <div key={x.label} className="min-w-[6.75rem] flex-1 basis-[7rem] space-y-1.5">
              <div className="flex justify-between gap-4 font-mono text-[10px] text-neutral-500">
                <span className="text-neutral-500">{x.label}</span>
                <span className="tabular-nums text-neutral-400">
                  {x.cur}
                  <span className="text-neutral-600">/</span>
                  {x.max}
                </span>
              </div>
              <div className="h-[3px] overflow-hidden rounded-full bg-[#161616]">
                <div
                  className="h-full rounded-full opacity-90 transition-[width] duration-300"
                  style={{ width: `${pct}%`, boxShadow: `0 0 12px ${accent}33`, backgroundColor: accent }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TOOLTIP_BLOOD_SUFFIX = "Poder de sangre (V5). Subir con ANCILLA o reglas mesa.";
const TEXTO_SUMA_DISC = (actual: number, meta: number, maxDot: number) =>
  `Disciplinas: ${actual}/${meta} puntos entre las tres líneas · máx. ${maxDot} en una disciplina al crear la ficha.`;

function buildSheetFromInitial(initial: CharacterSheet): CharacterSheet {
  return {
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
    classicAttrPreset: coerceClassicAttrPresetForClan(
      initial.clan ?? "other",
      typeof initial.classicAttrPreset === "number" && initial.classicAttrPreset >= 0 && initial.classicAttrPreset < 6
        ? initial.classicAttrPreset
        : 0,
    ),
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
  };
}

type Props = {
  initial: CharacterSheet;
  onSave: (sheet: CharacterSheet) => void;
  /** Solo lectura: muestra la matriz sin permitir edición (p. ej. HOJA tras sellar). */
  viewOnly?: boolean;
};

export function CharacterCreation({ initial, onSave, viewOnly }: Props) {
  const [sheet, setSheet] = useState<CharacterSheet>(() => buildSheetFromInitial(initial));
  const [triedSeal, setTriedSeal] = useState(false);
  const [codexHint, setCodexHint] = useState<string | null>(null);
  const hintClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function pokeHint(msg: string) {
    const t = msg.trim();
    if (!t) return;
    if (hintClearRef.current) clearTimeout(hintClearRef.current);
    setCodexHint(t);
    hintClearRef.current = setTimeout(() => {
      setCodexHint(null);
      hintClearRef.current = null;
    }, 3800);
  }

  useEffect(() => {
    return () => {
      if (hintClearRef.current) clearTimeout(hintClearRef.current);
    };
  }, []);

  const vo = viewOnly === true;

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
  const attrOk = !validateClassicAttributeSpread(sheet.attributes, sheet.classicAttrPreset);
  const skillOk = !validateClassicSkillSpread(sheet.skills, sheet.classicSkillPreset);
  const discOk = classicMode
    ? !validateClassicDisciplineSpread(sheet.disciplines, sheet.clan, sheet.caitiffDisciplinePicks, {
        budget: timeline.classicDisciplineBudget,
        maxPer: timeline.classicMaxPerDot,
      })
    : !validateDisciplines(sheet.disciplines, sheet.clan, sheet.generation, sheet.caitiffDisciplinePicks, {
        budget: timeline.v5DisciplineBudget,
        maxPerDot: timeline.v5MaxPerDot,
      });

  const repartoTotals = useMemo(() => summarizeClassicTotals(sheet), [sheet]);

  const canRollRandomMatrix = sheet.name.trim().length > 0;

  function applyRandomMatrix() {
    if (vo) return;
    if (!canRollRandomMatrix) return;
    if (
      !window.confirm(
        "Se generará una matriz que reparte atributos, habilidades y disciplinas al azar, dentro del reglamento vigente y el linaje seleccionado (presupuesto según modo y años sin vida). ¿Deseas sobrescribir el reparto manual actual?",
      )
    )
      return;
    const rolled = generateRandomCodexMatrix({
      clan: sheet.clan,
      chargenMotor: sheet.chargenMotor,
      generation: sheet.generation,
      yearsUnlife: sheet.yearsUnlife,
      caitiffDisciplinePicks: sheet.caitiffDisciplinePicks,
      timeline,
    });
    setSheet((s) => {
      const wpMax = willpowerMaxFromAttributes(rolled.attributes);
      return {
        ...s,
        attributes: rolled.attributes,
        skills: rolled.skills,
        disciplines: rolled.disciplines,
        classicAttrPreset: rolled.classicAttrPreset,
        classicSkillPreset: rolled.classicSkillPreset,
        willpowerMax: wpMax,
        willpowerCur: Math.min(s.willpowerCur, wpMax),
      };
    });
    setTriedSeal(false);
    pokeHint("Matriz al azar lista. Se puede refinar después con los puntos.");
  }

  const pendingSealBits = [
    triedSeal && !attrOk ? "atributos" : null,
    triedSeal && !skillOk ? "habilidades" : null,
    triedSeal && !discOk ? "disciplinas y poderes de clan" : null,
  ].filter(Boolean);

  function applyGeneration(gen: Generation) {
    setSheet((s) => ({ ...s, generation: gen, bloodPotency: bloodPotencyForGeneration(gen) }));
  }

  function setClan(cid: ClanId) {
    setSheet((s) => ({
      ...s,
      clan: cid,
      classicAttrPreset: coerceClassicAttrPresetForClan(cid, s.classicAttrPreset),
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
    if (vo) return;
    setTriedSeal(true);
    const picks =
      sheet.clan === "caitiff" || sheet.clan === "other"
        ? (sheet.caitiffDisciplinePicks ?? clanDefaultCaitiffPicks(sheet.clan))
        : null;
    if (picks && new Set(picks).size !== 3) return;
    const attrErr = validateClassicAttributeSpread(sheet.attributes, sheet.classicAttrPreset);
    const skillErr = validateClassicSkillSpread(sheet.skills, sheet.classicSkillPreset);
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
      if (!codexAllowsAttributeDots(s, key, v)) {
        queueMicrotask(() => {
          pokeHint(codexRejectHintAttribute(s, key, v));
        });
        return s;
      }
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
    setSheet((s) => {
      if (!codexAllowsSkillDots(s, key, v)) {
        queueMicrotask(() => pokeHint(codexRejectHintSkill(s, key, v)));
        return s;
      }
      return { ...s, skills: { ...s.skills, [key]: v } };
    });
  }

  function setDisc(key: DisciplineKey, v: number) {
    setSheet((s) => {
      if (!codexAllowsDisciplineDots(s, key, v)) {
        queueMicrotask(() => pokeHint(codexRejectHintDiscipline(s, key, v)));
        return s;
      }
      return { ...s, disciplines: { ...s.disciplines, [key]: v } };
    });
  }

  function resetToBlankCodex() {
    if (vo) return;
    if (
      !window.confirm(
        "¿Restablecer la plantilla CODEX a cero? Se borran titular del CV, concepto y todo el reparto hasta el estado base (atributos en punto base gris; habilidades sin puntos). El borrador en memoria se omite; lo guardado en el Nexo no cambia hasta el próximo sellado.",
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
      className={
        vo
          ? "min-h-screen bg-black pb-20 text-neutral-300"
          : "codex-dot-grid crt-wrap min-h-screen pb-20 text-neutral-300"
      }
      style={{ ["--clan-accent"]: accent } as CSSProperties}
    >
      {codexHint && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="pointer-events-none fixed bottom-8 left-1/2 z-50 max-w-md -translate-x-1/2 border border-neutral-700/80 bg-black/90 px-4 py-2.5 font-mono text-[10px] leading-snug tracking-tight text-neutral-200 shadow-lg sm:max-w-lg"
          style={{ boxShadow: `0 0 0 1px ${accent}22, 0 8px 32px #000c` }}
        >
          <span style={{ color: accent }}>{">"}</span> {codexHint}
        </div>
      )}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-6xl space-y-5 px-5 py-8 md:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#161616] pb-5 font-mono">
          <div>
            <p className="text-[9px] uppercase tracking-[0.35em] text-neutral-600">
              {vo ? "//_MATRIZ · ARCHIVO" : "CODEX_V"}
            </p>
            <h1 className="mt-1 text-sm font-normal tracking-[0.12em] text-neutral-400">
              {vo ? "Ficha sellada en el Nexo" : "Matriz Cainita"}
            </h1>
          </div>
          {!vo ? (
            <button
              type="button"
              onClick={resetToBlankCodex}
              title="Elimina el borrador actual y carga la plantilla CODEX inicial (sin datos en caché)."
              className="shrink-0 border border-[#2a2a2a] bg-black/40 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-500 hover:border-neutral-600 hover:text-neutral-400"
            >
              [NUEVA_MATRIZ]
            </button>
          ) : null}
        </header>

        <section className="divide-y divide-[#161616] border border-[#161616] bg-black/20">
          <div className="grid gap-4 p-4 md:grid-cols-12">
            <div className="md:col-span-4">
              <label className="text-[9px] uppercase tracking-widest text-neutral-600">&gt;_CV · NOMBRE</label>
              <input
                value={sheet.name}
                disabled={vo}
                onChange={(e) => setSheet((s) => ({ ...s, name: e.target.value }))}
                className={`${inputBase} mt-2`}
              />
            </div>
            <div className="md:col-span-4">
              <label className="text-[9px] uppercase tracking-widest text-neutral-600">&gt;_LINAJE</label>
              <select
                value={sheet.clan}
                disabled={vo}
                onChange={(e) => setClan(e.target.value as ClanId)}
                className={`${inputBase} mt-2 ${vo ? "cursor-not-allowed opacity-90" : "cursor-pointer"}`}
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
                disabled={vo}
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
              readOnly={vo}
            />

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 md:col-span-12 md:border-t md:border-[#222] md:pt-4">
              <span className="text-[9px] text-neutral-600">GENERACIÓN</span>
              <label className={`flex items-center gap-2 font-mono text-[10px] ${vo ? "" : "cursor-pointer"}`}>
                <input
                  type="radio"
                  disabled={vo}
                  checked={sheet.generation === "neonato"}
                  onChange={() => applyGeneration("neonato")}
                />
                NEONATO
              </label>
              <label className={`flex items-center gap-2 font-mono text-[10px] ${vo ? "" : "cursor-pointer"}`}>
                <input
                  type="radio"
                  disabled={vo}
                  checked={sheet.generation === "ancilla"}
                  onChange={() => applyGeneration("ancilla")}
                />
                ANCILLA
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
                  disabled={vo}
                  onChange={(v) => setSheet((s) => ({ ...s, humanity: v }))}
                />
              </span>
              <label className="flex items-center gap-2 font-mono text-[10px] text-neutral-500" title={TOOLTIP_RESONANCE}>
                <span className="text-[9px] uppercase text-neutral-600">SIGN</span>
                <select
                  value={sheet.resonance}
                  disabled={vo}
                  onChange={(e) => setSheet((s) => ({ ...s, resonance: e.target.value }))}
                  className={`${inputBase} !w-auto ${vo ? "cursor-not-allowed opacity-90" : ""}`}
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
                    disabled={vo}
                    onChange={(e) =>
                      setSheet((s) => ({
                        ...s,
                        freebiePool: Math.max(0, Math.min(999, Number(e.target.value) || 0)),
                      }))
                    }
                    className={`${inputBase} max-w-[6rem]`}
                  />
                </div>
              </div>
            )}

            <div className="border-t border-[#222] pt-6 md:col-span-12">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 space-y-0.5">
                  <p
                    className="text-[9px] font-medium uppercase tracking-[0.24em] text-neutral-600"
                    title="Prioridad física/social/mental y carriles de habilidad; cada preset muestra cupos."
                  >
                    Reparto
                  </p>
                </div>
                {!vo ? (
                  <button
                    type="button"
                    disabled={!canRollRandomMatrix}
                    title={
                      canRollRandomMatrix
                        ? "Llena la matriz al azar según el reglamento (con nombre y linaje ya indicados)."
                        : "Primero escribe el nombre en el CV."
                    }
                    onClick={applyRandomMatrix}
                    className={`shrink-0 border px-4 py-2 font-mono text-[9px] uppercase tracking-[0.18em] transition-colors ${canRollRandomMatrix ? "border-neutral-700 text-neutral-300 hover:border-[var(--clan-accent)] hover:text-neutral-200" : "cursor-not-allowed border-neutral-800 text-neutral-600"}`}
                    style={
                      canRollRandomMatrix
                        ? { boxShadow: `inset 0 0 0 1px ${accent}14` }
                        : undefined
                    }
                  >
                    Matriz al azar
                  </button>
                ) : null}
              </div>
              <div className="grid gap-8 md:grid-cols-2">
                <div className="min-w-0 space-y-2">
                  <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-600">
                    Atributos · 7 / 5 / 3 sobre base
                  </label>
                  <select
                    value={sheet.classicAttrPreset}
                    disabled={vo}
                    onChange={(e) =>
                      setSheet((s) => ({
                        ...s,
                        classicAttrPreset: Number(e.target.value),
                      }))
                    }
                    className={`${inputBase} w-full min-w-0 ${vo ? "cursor-not-allowed opacity-90" : "cursor-pointer"}`}
                  >
                    {classicAttrPresetChoicesForClan(sheet.clan).map((i) => (
                      <option key={i} value={i}>
                        {classicAttrPresetSummary(i)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0 space-y-2">
                  <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-600">
                    Habilidades · 13 / 9 / 5 por carril
                  </label>
                  <select
                    value={sheet.classicSkillPreset}
                    disabled={vo}
                    onChange={(e) =>
                      setSheet((s) => ({
                        ...s,
                        classicSkillPreset: Number(e.target.value),
                      }))
                    }
                    className={`${inputBase} w-full min-w-0 ${vo ? "cursor-not-allowed opacity-90" : "cursor-pointer"}`}
                  >
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <option key={i} value={i}>
                        {classicSkillPresetSummary(i)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-8 grid gap-4 lg:grid-cols-2">
                <AllocationMeters
                  accent={accent}
                  title="Avance · atributos (exceso sobre 1)"
                  rows={[
                    { label: "Alta prioridad", cur: repartoTotals.attrs.primary, max: ATRIBUTOS_SCHEMA.primary },
                    { label: "Media", cur: repartoTotals.attrs.secondary, max: ATRIBUTOS_SCHEMA.secondary },
                    { label: "Baja", cur: repartoTotals.attrs.tertiary, max: ATRIBUTOS_SCHEMA.tertiary },
                  ]}
                />
                <AllocationMeters
                  accent={accent}
                  title="Avance · habilidades por bloque del preset"
                  rows={[
                    { label: "Bloque principal", cur: repartoTotals.skills.primary, max: HABILIDADES_SCHEMA.primary },
                    { label: "Bloque medio", cur: repartoTotals.skills.secondary, max: HABILIDADES_SCHEMA.secondary },
                    { label: "Bloque menor", cur: repartoTotals.skills.tertiary, max: HABILIDADES_SCHEMA.tertiary },
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-3">
          <section className={`border border-[#161616] bg-black/25 ${ring(attrOk)}`}>
            <h2 className="border-b border-[#161616] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.32em] text-neutral-600">
              Atributos
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
                            max={5}
                            accent={accent}
                            minimal={false}
                            baselineFilled={CHARGEN_ATTRIBUTE_DOT_BASE}
                            increaseCeiling={codexMaxAttributeDots(sheet, key)}
                            onIncreaseBlocked={(t) =>
                              pokeHint(codexRejectHintAttribute(sheet, key, t))
                            }
                            value={sheet.attributes[key]}
                            disabled={vo}
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
              Habilidades
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
                          max={5}
                          accent={accent}
                          minimal={false}
                          increaseCeiling={codexMaxSkillDots(sheet, key)}
                          onIncreaseBlocked={(t) => pokeHint(codexRejectHintSkill(sheet, key, t))}
                          value={sheet.skills[key] ?? 0}
                          disabled={vo}
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
            <h2
              className="border-b border-[#222] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.32em] text-neutral-600"
              title={TEXTO_SUMA_DISC(
                discDotsSum,
                classicMode ? timeline.classicDisciplineBudget : timeline.v5DisciplineBudget,
                classicMode ? timeline.classicMaxPerDot : timeline.v5MaxPerDot,
              )}
            >
              Disciplinas
            </h2>
            <div className="space-y-3 p-4">
              {(sheet.clan === "caitiff" || sheet.clan === "other") && (
                <div className="grid gap-2">
                  {([0, 1, 2] as const).map((slot) => (
                    <select
                      key={slot}
                      value={caitiffEff[slot]}
                      disabled={vo}
                      onChange={(e) => setPickSlot(slot, e.target.value as DisciplineKey)}
                      className={`${inputBase} ${vo ? "cursor-not-allowed opacity-90" : "cursor-pointer"}`}
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
                    increaseCeiling={codexMaxDisciplineDots(sheet, k)}
                    onIncreaseBlocked={(t) => pokeHint(codexRejectHintDiscipline(sheet, k, t))}
                    value={(sheet.disciplines[k] as number) ?? 0}
                    disabled={vo}
                    onChange={(v) => setDisc(k, v)}
                  />
                </div>
              ))}

              {!vo ? (
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
              ) : null}
              {!vo && pendingSealBits.length > 0 ? (
                <p className="mt-2 font-mono text-[8px] leading-relaxed tracking-tight text-[var(--blood)]">
                  Falta para activar el nexo:{" "}
                  <span className="text-neutral-400">{pendingSealBits.join(" · ")}.</span>
                </p>
              ) : null}
              {!vo && triedSeal && !discOk ? (
                <p className="mt-2 font-mono text-[8px] leading-relaxed text-neutral-500">
                  Para sellar, la suma de las tres disciplinas activas debe ser exactamente{" "}
                  {classicMode ? timeline.classicDisciplineBudget : timeline.v5DisciplineBudget} puntos entre las
                  disciplinas activas (ahora hay {discDotsSum}).
                </p>
              ) : null}
            </div>
          </section>

          <section className="border border-[#222] bg-black/25 lg:col-span-3">
            <h2 className="border-b border-[#222] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.32em] text-neutral-600">
              Trasfondo
            </h2>
            <div className="p-4">
              <textarea
                value={sheet.transfondo ?? ""}
                disabled={vo}
                onChange={(e) =>
                  setSheet((s) => ({ ...s, transfondo: e.target.value.slice(0, 16000) }))
                }
                rows={6}
                title="Historia previa, vínculos y hechos que el Cronista puede asumir."
                placeholder="Méritos narrativos, alianzas, recursos, vínculos…"
                className="w-full resize-y border border-[#222] bg-black/50 px-3 py-2 text-xs leading-relaxed text-neutral-300 placeholder:text-neutral-700 focus:border-[var(--terminal)]/50 focus:outline-none disabled:opacity-50"
              />
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
