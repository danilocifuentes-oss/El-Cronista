"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CharacterSheet, ClanId } from "@/lib/character";
import { CLAN_OPTIONS } from "@/lib/character";
import { disciplineLabel } from "@/lib/sereno";
import { getSoloChapter, getSoloScene } from "@/lib/soloCampaign/chapters";
import { checkOptionAvailability, listFailReasons, resolveDisciplineTierText } from "@/lib/soloCampaign/requirementEngine";
import { filterSoloOptionsForSheet, sortSoloOptionsForDisplay } from "@/lib/soloCampaign/optionPresentation";
import { loadSheet, normalizeCharacterSheet, saveSheet } from "@/lib/character";
import { loadSoloProgress, saveSoloProgress } from "@/lib/soloCampaign/progressStore";
import type { SoloOption, SoloProgress, SoloSceneEffect } from "@/lib/soloCampaign/types";
import { getChronicleClanPresentation } from "@/lib/soloCampaign/clanPresentationCopy";
import {
  CHRONICLE_PRELUDE_COMMON,
  CHRONICLE_PRELUDE_CONTENT_VERSION,
  CHRONICLE_PRELUDE_MASK_STINGER,
} from "@/lib/soloCampaign/preludeCopy";
import { getPendingNextChapter } from "@/lib/soloCampaign/soloProgressSelectors";
import { syncActiveBundleFromGlobals } from "@/lib/profileStore";
import { TechnicalHud } from "@/components/TechnicalHud";
import { SoloCampaignProvider, useSoloCampaign } from "@/context/SoloCampaignContext";
import { rollPoolV5, summarizeRollPlayerLog } from "@/lib/dice";
import { appendXpLog } from "@/lib/sessionMeta";
import {
  applyOpeningChronicleVitals,
  CHRONICLE_HEALTH_TRACK_UI,
  CHRONICLE_OPENING_SCENE_ID,
  CHRONICLE_XP_CRITICAL_EXTRA,
  CHRONICLE_XP_ROLL_SUCCESS_DEFAULT,
  SOLO_FLAG_OPENING_VITALS,
} from "@/lib/soloCampaign/chronicleMechanics";
import { applyPreRollResourceCost, soloOptionUsesDice } from "@/lib/soloCampaign/rollResourceCost";

const OPTION_TYPE_LABEL: Record<string, string> = {
  discipline: "DISCIPLINA",
  skill: "HABILIDAD",
  clan: "CLAN",
};

const SOLO_BACK_STACK_LIMIT = 120;

function sumReputationDeltas(list: SoloOption["effects"]): number {
  if (!list?.length) return 0;
  return list.reduce((acc, e) => (e.type === "reputationDelta" ? acc + e.delta : acc), 0);
}

function partitionExperienceEffects(branchEffects: SoloSceneEffect[]): { sheetFx: SoloSceneEffect[]; xpFromNarrative: number } {
  let xpFromNarrative = 0;
  const sheetFx: SoloSceneEffect[] = [];
  for (const e of branchEffects) {
    if (e.type === "experienceDelta") xpFromNarrative += e.delta;
    else sheetFx.push(e);
  }
  return { sheetFx, xpFromNarrative };
}

const CLAN_TONE: Partial<Record<ClanId, string>> = {
  malkavian: "text-cyan-200",
  ventrue: "text-amber-200",
  brujah: "text-orange-200",
  toreador: "text-rose-200",
  nosferatu: "text-emerald-200",
  tremere: "text-indigo-200",
};

type Props = {
  profileId: string;
  sheet: CharacterSheet;
  onExit: () => void;
  /** Tras persistir CODEX desde la campaña, actualiza Nexo/React (nombre, vitae, etc.). */
  onSheetSynced?: (next: CharacterSheet) => void;
  /** Incrustado en el marco Nexo (canal + digest): sin segunda columna de estado duplicada. */
  embedded?: boolean;
  /** Inyecta texto al hilo paralelo del SchreckNet (eco narrativo). */
  emitParalelaNarration?: (text: string) => void;
};

const SOLO_SUPPORTED_CLANS: ClanId[] = ["brujah", "ventrue", "toreador", "malkavian"];

function isSoloSupportedClan(clan: ClanId): boolean {
  return SOLO_SUPPORTED_CLANS.includes(clan);
}

function startSceneForClan(): string {
  return "n1_1";
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function isChroniclePreludeDismissed(progress: SoloProgress): boolean {
  return (progress.chroniclePreludeSeenVersion ?? 0) >= CHRONICLE_PRELUDE_CONTENT_VERSION;
}

function applySceneEffectDraft(base: CharacterSheet, flags: Record<string, boolean>, effect: NonNullable<SoloOption["effects"]>[number]) {
  let next = base;
  if (effect.type === "setFlag") flags[effect.flag] = effect.value ?? true;
  if (effect.type === "hungerDelta") {
    next = { ...next, hunger: Math.max(0, Math.min(5, next.hunger + effect.delta)) };
  }
  if (effect.type === "humanityDelta") {
    next = { ...next, humanity: Math.max(0, Math.min(10, next.humanity + effect.delta)) };
  }
  if (effect.type === "healthDamageDelta") {
    const cap = CHRONICLE_HEALTH_TRACK_UI;
    next = {
      ...next,
      healthDamage: Math.max(0, Math.min(cap, next.healthDamage + effect.delta)),
    };
  }
  if (effect.type === "willpowerDelta") {
    next = {
      ...next,
      willpowerCur: clamp(next.willpowerCur + effect.delta, 0, next.willpowerMax),
    };
  }
  return next;
}

function resolveSoloRollPlan(option: SoloOption, sheet: CharacterSheet): { pool: number; difficulty: number; label: string } {
  const req = option.requirement;
  if (req.type === "discipline") {
    const dots = Number(sheet.disciplines?.[req.discipline] ?? 0);
    return {
      pool: clamp(2 + dots, 1, 10),
      difficulty: clamp(2 + req.minLevel, 2, 6),
      label: `Disciplina · ${disciplineLabel(req.discipline)}`,
    };
  }
  if (req.type === "skill") {
    const skillDots = Number(sheet.skills?.[req.skill] ?? 0);
    return {
      pool: clamp(Number(sheet.attributes.res ?? 1) + skillDots, 1, 12),
      difficulty: clamp(2 + req.minLevel, 2, 6),
      label: `Habilidad · ${req.skill}`,
    };
  }
  if (req.type === "attribute") {
    const attrDots = Number(sheet.attributes?.[req.attribute] ?? 0);
    return {
      pool: clamp(attrDots + Number(sheet.attributes.res ?? 1), 1, 12),
      difficulty: clamp(2 + req.minLevel, 2, 6),
      label: `Atributo · ${req.attribute}`,
    };
  }
  if (option.type === "discipline" && option.discipline) {
    const dots = Number(sheet.disciplines?.[option.discipline] ?? 0);
    return {
      pool: clamp(2 + dots, 1, 10),
      difficulty: 3,
      label: `Disciplina · ${disciplineLabel(option.discipline)}`,
    };
  }
  if (option.type === "skill" && option.skill) {
    const skillDots = Number(sheet.skills?.[option.skill] ?? 0);
    return {
      pool: clamp(Number(sheet.attributes.res ?? 1) + skillDots, 1, 12),
      difficulty: 3,
      label: `Habilidad · ${option.skill}`,
    };
  }
  return {
    pool: clamp(Number(sheet.attributes.com ?? 1) + Number(sheet.attributes.res ?? 1), 1, 12),
    difficulty: option.type === "clan" ? 3 : 2,
    label: "Resolución social",
  };
}

function ensureProgress(profileId: string, sheet: CharacterSheet): SoloProgress {
  const startSceneId = startSceneForClan();
  const existing = loadSoloProgress(profileId, sheet.clan);
  if (existing) return existing;
  const base: SoloProgress = {
    version: 1,
    profileId,
    playerName: sheet.name?.trim() || "Sin nombre",
    clan: sheet.clan,
    humanity: sheet.humanity,
    reputation: 0,
    chronicleExperience: 0,
    chapterId: "chapter01",
    sceneId: startSceneId,
    chroniclePreludeSeenVersion: 0,
    chapterContextSeen: {},
    flags: { clan_intro_seen: false },
    visitedSceneIds: [startSceneId],
    soloSceneBackStack: [],
    decisionHistory: [],
    updatedAt: Date.now(),
  };
  saveSoloProgress(base);
  return base;
}

export function SoloCampaignApp({
  profileId,
  sheet,
  onExit,
  onSheetSynced,
  embedded = false,
  emitParalelaNarration,
}: Props) {
  const isSupported = isSoloSupportedClan(sheet.clan);
  /** Estado inicial sólo en montaje (el componente lleva key de perfil; no reprocesar al mutar hambre en vivo). */
  const [initialProgress] = useState(() => ensureProgress(profileId, sheet));

  if (!isSupported) {
    const clanLabel = CLAN_OPTIONS.find((c) => c.id === sheet.clan)?.label ?? sheet.clan;
    return (
      <div className="min-h-screen bg-[#050505] px-4 py-10 font-mono text-neutral-300">
        <div className="mx-auto max-w-2xl space-y-4 border border-amber-900/40 bg-black/50 p-6 sharp-border-inner">
          <p className="text-[10px] uppercase tracking-[0.28em] text-amber-300">Campaña Solitaria</p>
          <h2 className="font-sans text-xl text-neutral-100">Clan aún no disponible</h2>
          <p className="text-sm leading-relaxed text-neutral-400">
            Tu personaje es <span className="text-neutral-200">{clanLabel}</span>. Por ahora la crónica solitaria abre con{" "}
            <span className="text-neutral-200">Brujah</span>, <span className="text-neutral-200">Ventrue</span>,{" "}
            <span className="text-neutral-200">Toreador</span> y <span className="text-neutral-200">Malkavian</span>.
          </p>
          <p className="text-xs text-neutral-500">
            Puedes conservar esta hoja y volver aquí cuando publiquemos su capítulo de clan.
          </p>
          <button
            type="button"
            onClick={onExit}
            className="border border-neutral-700 px-3 py-2 text-[10px] uppercase tracking-[0.2em]"
          >
            Volver al Nexo
          </button>
        </div>
      </div>
    );
  }

  return (
    <SoloCampaignProvider key={profileId} initialProgress={initialProgress}>
      <SoloCampaignScreen
        profileId={profileId}
        sheet={sheet}
        onExit={onExit}
        onSheetSynced={onSheetSynced}
        embedded={embedded}
        emitParalelaNarration={emitParalelaNarration}
      />
    </SoloCampaignProvider>
  );
}

function SoloCampaignScreen({
  profileId,
  sheet,
  onExit,
  onSheetSynced,
  embedded = false,
  emitParalelaNarration,
}: Props) {
  const { progress, setProgress } = useSoloCampaign();
  const transitionLockRef = useRef(false);
  const [lastRollLine, setLastRollLine] = useState<string>("");
  const preludeChannelKeyRef = useRef("");
  const clanChannelKeyRef = useRef("");

  useEffect(() => {
    transitionLockRef.current = false;
  }, [progress.sceneId, progress.chapterId]);
  const chapter = useMemo(() => getSoloChapter(progress.chapterId), [progress.chapterId]);
  const scene = useMemo(() => getSoloScene(progress.chapterId, progress.sceneId), [progress.chapterId, progress.sceneId]);
  const displayedOptions = useMemo(() => {
    if (!scene) return [];
    return sortSoloOptionsForDisplay(filterSoloOptionsForSheet(scene.options, sheet));
  }, [scene, sheet]);
  const clanIntroGateDone = progress.chapterId !== "chapter01" || progress.flags.clan_intro_seen === true;
  const pendingNextChapter = getPendingNextChapter(progress);
  const clanLabel = CLAN_OPTIONS.find((c) => c.id === sheet.clan)?.label ?? sheet.clan;
  const preludeStinger =
    CHRONICLE_PRELUDE_MASK_STINGER[sheet.clan] ??
    "Tu máscara es la cara que decide financiar hasta que algún testigo cobre en otra moneda.";

  const clanPresentationText = getChronicleClanPresentation(sheet.clan);

  const preludeGateDoneUi = isChroniclePreludeDismissed(progress);
  const openingVitalsApplied = Boolean(progress.flags[SOLO_FLAG_OPENING_VITALS]);

  useEffect(() => {
    if (!emitParalelaNarration) return;
    if (preludeGateDoneUi) return;
    const key = `${profileId}:${CHRONICLE_PRELUDE_CONTENT_VERSION}:prelude`;
    if (preludeChannelKeyRef.current === key) return;
    emitParalelaNarration(`${CHRONICLE_PRELUDE_COMMON}\n\n${preludeStinger}`.trim());
    preludeChannelKeyRef.current = key;
  }, [emitParalelaNarration, preludeGateDoneUi, profileId, preludeStinger]);

  useEffect(() => {
    if (!emitParalelaNarration) return;
    if (!preludeGateDoneUi) return;
    if (progress.chapterId !== "chapter01" || progress.flags.clan_intro_seen) return;
    const key = `${profileId}:clan_intro_echo`;
    if (clanChannelKeyRef.current === key) return;
    emitParalelaNarration(clanPresentationText);
    clanChannelKeyRef.current = key;
  }, [emitParalelaNarration, preludeGateDoneUi, progress.chapterId, progress.flags.clan_intro_seen, profileId, clanPresentationText]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canNarrative = preludeGateDoneUi && clanIntroGateDone && scene?.id === CHRONICLE_OPENING_SCENE_ID;
    if (!canNarrative || openingVitalsApplied) return;
    const latest = loadSoloProgress(profileId, sheet.clan);
    if (!latest) return;
    const stored = loadSheet();
    if (!stored) return;
    const nextSheet = applyOpeningChronicleVitals(normalizeCharacterSheet(stored));
    saveSheet(nextSheet);
    onSheetSynced?.(nextSheet);
    appendXpLog("Crónica: estado vital inicial aplicado en Teatinos (eco Codex sincronizado).");
    syncActiveBundleFromGlobals(profileId);
    const progFlag: SoloProgress = {
      ...latest,
      flags: { ...latest.flags, [SOLO_FLAG_OPENING_VITALS]: true },
      updatedAt: latest.updatedAt + 1,
    };
    saveSoloProgress(progFlag);
    setProgress(progFlag);
  }, [preludeGateDoneUi, clanIntroGateDone, scene?.id, openingVitalsApplied, profileId, sheet.clan, setProgress, onSheetSynced]);

  const applyOption = (option: SoloOption) => {
    if (transitionLockRef.current) return;
    const availability = checkOptionAvailability(option, sheet);
    if (!availability.available) return;
    transitionLockRef.current = true;

    let nextSheet = sheet;
    const nextFlags = { ...progress.flags };
    let rollLine: string;
    let rollPassed = true;
    let targetSceneId = option.nextSceneId;
    let branchEffects: SoloSceneEffect[];
    let rollXpEarned = 0;
    let xpFromNarrative = 0;

    if (soloOptionUsesDice(option)) {
      const wpBefore = nextSheet.willpowerCur;
      const hungerBefore = nextSheet.hunger;
      nextSheet = applyPreRollResourceCost(nextSheet, option);
      if (nextSheet.willpowerCur < wpBefore) {
        appendXpLog("Crónica: activación de disciplina (−1 voluntad).");
      } else if (nextSheet.hunger > hungerBefore) {
        appendXpLog("Crónica: activación de disciplina (+1 presión de hambre / Vitae).");
      }
      const rollPlan = resolveSoloRollPlan(option, nextSheet);
      const roll = rollPoolV5(rollPlan.pool, nextSheet.hunger, rollPlan.difficulty);
      rollLine = `${rollPlan.label} · ${summarizeRollPlayerLog(roll)}`;
      rollPassed = roll.passed;
      const isCritical = roll.criticalNormal || roll.messyCritical;
      branchEffects = roll.passed
        ? isCritical
          ? [...(option.effects ?? []), ...(option.effectsOnCritical ?? [])]
          : option.effects ?? []
        : [...(option.effects ?? []), ...(option.effectsOnFail ?? [])];
      const partRoll = partitionExperienceEffects(branchEffects);
      xpFromNarrative = partRoll.xpFromNarrative;
      for (const effect of partRoll.sheetFx) {
        nextSheet = applySceneEffectDraft(nextSheet, nextFlags, effect);
      }
      if (rollPassed) {
        rollXpEarned = option.experienceOnSuccessfulRoll ?? CHRONICLE_XP_ROLL_SUCCESS_DEFAULT;
        if (isCritical) rollXpEarned += CHRONICLE_XP_CRITICAL_EXTRA;
      }
      if (!roll.passed) {
        nextSheet = { ...nextSheet, hunger: Math.max(0, Math.min(5, nextSheet.hunger + 1)) };
        nextFlags[`roll_fail_${option.id}`] = true;
        if (roll.fracasoBestial) {
          nextSheet = { ...nextSheet, humanity: Math.max(0, Math.min(10, nextSheet.humanity - 1)) };
        }
      } else if (isCritical) {
        nextFlags[`roll_crit_${option.id}`] = true;
      }
      targetSceneId = !roll.passed
        ? option.nextSceneIdOnFail ?? option.nextSceneId
        : isCritical
          ? option.nextSceneIdOnCritical ?? option.nextSceneId
          : option.nextSceneId;
    } else {
      rollLine = "Elección directa";
      branchEffects = option.effects ?? [];
      const partDlg = partitionExperienceEffects(branchEffects);
      xpFromNarrative = partDlg.xpFromNarrative;
      for (const effect of partDlg.sheetFx) {
        nextSheet = applySceneEffectDraft(nextSheet, nextFlags, effect);
      }
    }

    const chronicleXpThisChoice = xpFromNarrative + rollXpEarned;

    setLastRollLine(rollLine);

    if (nextSheet !== sheet) {
      saveSheet(nextSheet);
      syncActiveBundleFromGlobals(profileId);
      onSheetSynced?.(nextSheet);
    }
    if (chronicleXpThisChoice > 0) appendXpLog(`Crónica +${chronicleXpThisChoice} PX`);
    if (chronicleXpThisChoice > 0 || nextSheet !== sheet) syncActiveBundleFromGlobals(profileId);
    const nextScene = getSoloScene(progress.chapterId, targetSceneId);
    const sceneId = nextScene?.id ?? progress.sceneId;
    const reputationGain = sumReputationDeltas(branchEffects);
    const tick = progress.updatedAt + 1;
    const backSnap = { chapterId: progress.chapterId, sceneId: progress.sceneId };
    const prevStack = progress.soloSceneBackStack ?? [];
    const next: SoloProgress = {
      ...progress,
      playerName: sheet.name?.trim() || progress.playerName,
      clan: sheet.clan,
      humanity: nextSheet.humanity,
      chronicleExperience: Math.max(0, (progress.chronicleExperience ?? 0) + chronicleXpThisChoice),
      reputation: progress.reputation + reputationGain,
      sceneId,
      flags: nextFlags,
      visitedSceneIds: Array.from(new Set([...progress.visitedSceneIds, sceneId])),
      soloSceneBackStack: [...prevStack, backSnap].slice(-SOLO_BACK_STACK_LIMIT),
      decisionHistory: [
        ...progress.decisionHistory,
        {
          sceneId: progress.sceneId,
          optionId: option.id,
          ts: tick,
          rollSummary: rollLine,
          rollPassed,
        },
      ].slice(-120),
      updatedAt: tick,
    };
    saveSoloProgress(next);
    setProgress(next);
  };

  const revertToPrevScene = () => {
    if (transitionLockRef.current) return;
    const stack = [...(progress.soloSceneBackStack ?? [])];
    if (!stack.length) return;
    const prev = stack.pop()!;
    transitionLockRef.current = true;

    const nextDecisionHistory = [...progress.decisionHistory];
    const last = nextDecisionHistory[nextDecisionHistory.length - 1];
    if (last?.sceneId === prev.sceneId) nextDecisionHistory.pop();

    const next: SoloProgress = {
      ...progress,
      chapterId: prev.chapterId,
      sceneId: prev.sceneId,
      soloSceneBackStack: stack,
      decisionHistory: nextDecisionHistory,
      updatedAt: progress.updatedAt + 1,
    };
    saveSoloProgress(next);
    setProgress(next);
    setLastRollLine("");
  };

  if (!chapter || !scene) {
    return (
      <div className="min-h-screen bg-[#050505] px-4 py-10 font-mono text-neutral-300">
        <div className="mx-auto max-w-2xl space-y-4 border border-red-900/40 bg-black/50 p-6">
          <p className="text-[10px] uppercase tracking-[0.28em] text-red-300">Campaña Solitaria</p>
          <p>No se pudo cargar la escena actual. Vuelve al Nexo o al registro de fichas y revisa el personaje.</p>
          <button
            type="button"
            onClick={onExit}
            className="border border-neutral-700 px-3 py-2 text-[10px] uppercase tracking-[0.2em]"
          >
            Volver al Nexo
          </button>
        </div>
      </div>
    );
  }

  const sceneHeadingId = `solo-scene-title-${scene.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const hudFilled = CHRONICLE_HEALTH_TRACK_UI - Math.min(sheet.healthDamage, CHRONICLE_HEALTH_TRACK_UI);
  const mainGameplay = isChroniclePreludeDismissed(progress) && clanIntroGateDone;

  return (
    <div
      className={
        embedded
          ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-black/20 font-mono text-neutral-300"
          : "flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top,#0f1118_0%,#050505_45%,#030303_100%)] font-mono text-neutral-300"
      }
    >
      {!embedded ? (
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] bg-black/85 px-2 py-2 sm:px-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <TechnicalHud
              healthFilled={hudFilled}
              healthMax={CHRONICLE_HEALTH_TRACK_UI}
              hunger={sheet.hunger}
              compactLabels
              hideMetagameFooter
              className="border-0 bg-transparent px-0 py-0"
            />
            <div className="min-w-0 truncate font-sans text-[10px] text-neutral-500">
              <span className="text-neutral-200">{sheet.name || "Sin nombre"}</span>
              <span className="text-neutral-600"> · </span>
              <span className={CLAN_TONE[sheet.clan] ?? "text-neutral-300"}>{clanLabel}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {(progress.soloSceneBackStack?.length ?? 0) > 0 ? (
              <button
                type="button"
                onClick={() => revertToPrevScene()}
                className="border border-dashed border-amber-800/60 bg-amber-950/25 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.16em] text-amber-200 hover:bg-amber-950/40"
              >
                ↩ Escena
              </button>
            ) : null}
            <button
              type="button"
              onClick={onExit}
              className="border border-neutral-700 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.16em] text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
            >
              Salir
            </button>
          </div>
        </header>
      ) : null}

      {embedded && (progress.soloSceneBackStack?.length ?? 0) > 0 ? (
        <div className="flex shrink-0 justify-end border-b border-white/[0.06] bg-black/45 px-2 py-1.5">
          <button
            type="button"
            onClick={() => revertToPrevScene()}
            className="border border-dashed border-amber-800/55 bg-amber-950/20 px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-amber-200 hover:bg-amber-950/35"
          >
            ↩ Escena anterior
          </button>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col" aria-label="Historia y opciones">
        <div
          className={`min-h-0 flex-1 overflow-y-auto ${embedded ? "px-3 py-3 sm:px-4" : "px-4 py-5 sm:px-8"} ${mainGameplay ? "pb-2" : ""}`}
        >
          <div className="mx-auto max-w-2xl space-y-6">
            {!embedded ? (
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-neutral-600">{chapter.title}</p>
            ) : null}

            {!isChroniclePreludeDismissed(progress) ? (
              <section className="space-y-4 border border-[var(--terminal)]/25 bg-black/55 p-5 sharp-border-inner">
                {emitParalelaNarration ? (
                  <p className="text-sm text-neutral-500">El arranque quedó en el canal.</p>
                ) : (
                  <>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-300">{CHRONICLE_PRELUDE_COMMON}</p>
                    <p className={`text-sm leading-relaxed italic ${CLAN_TONE[sheet.clan] ?? "text-neutral-200"}`}>{preludeStinger}</p>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const next = {
                      ...progress,
                      chroniclePreludeSeenVersion: CHRONICLE_PRELUDE_CONTENT_VERSION,
                      flags: { ...progress.flags, chronicle_curtain_seen: true },
                      updatedAt: progress.updatedAt + 1,
                    };
                    saveSoloProgress(next);
                    setProgress(next);
                  }}
                  className="border border-[var(--terminal)]/40 bg-neutral-950/80 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--terminal)]"
                >
                  Continuar
                </button>
              </section>
            ) : null}

            {isChroniclePreludeDismissed(progress) && progress.chapterId === "chapter01" && !progress.flags.clan_intro_seen ? (
              <section className="space-y-4 border border-neutral-900 bg-black/45 p-5 sharp-border-inner">
                {!emitParalelaNarration ? (
                  <p className={`text-sm leading-relaxed ${CLAN_TONE[sheet.clan] ?? "text-neutral-200"}`}>{clanPresentationText}</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    const next = {
                      ...progress,
                      flags: { ...progress.flags, clan_intro_seen: true },
                      updatedAt: progress.updatedAt + 1,
                    };
                    saveSoloProgress(next);
                    setProgress(next);
                  }}
                  className="border border-[var(--terminal)]/40 bg-neutral-950/80 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--terminal)]"
                >
                  Continuar
                </button>
              </section>
            ) : null}

            {mainGameplay ? (
              <section className="space-y-4" aria-labelledby={sceneHeadingId}>
                <h2 id={sceneHeadingId} className="sr-only">
                  {scene.title}
                </h2>
                <p className="whitespace-pre-line leading-relaxed text-neutral-200">{scene.text}</p>
                {scene.clanFlavor?.[sheet.clan] ? (
                  <p className={`text-sm italic leading-relaxed ${CLAN_TONE[sheet.clan] ?? "text-neutral-300"}`}>{scene.clanFlavor[sheet.clan]}</p>
                ) : null}
              </section>
            ) : null}
          </div>
        </div>

        {mainGameplay ? (
          <div className="shrink-0 border-t border-white/[0.06] bg-gradient-to-t from-black via-black/92 to-transparent px-3 pb-6 pt-4 sm:px-6">
            <div className="mx-auto max-w-2xl space-y-3">
              {lastRollLine ? (
                <p className="text-center font-sans text-xs leading-relaxed text-neutral-500">{lastRollLine}</p>
              ) : null}

              <div className="space-y-2.5">
                {displayedOptions.map((option) => {
                  const state = checkOptionAvailability(option, sheet);
                  const fail = listFailReasons(option, sheet);
                  const optionText = resolveDisciplineTierText(option, sheet);
                  const typeLine = OPTION_TYPE_LABEL[option.type];
                  const choiceLabel =
                    option.type === "dialogue"
                      ? optionText
                      : option.discipline !== undefined
                        ? `${typeLine ?? ""}: ${disciplineLabel(option.discipline)} — ${optionText}`.replace(/^:\s*/, "")
                        : option.skill !== undefined
                          ? `${typeLine ?? ""}: ${option.skill} — ${optionText}`.replace(/^:\s*/, "")
                          : typeLine
                            ? `${typeLine}: ${optionText}`
                            : optionText;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={!state.available}
                      aria-label={state.available ? choiceLabel : `${choiceLabel}. No disponible.`}
                      aria-describedby={!state.available && fail.length ? `${option.id}-why` : undefined}
                      onClick={() => applyOption(option)}
                      className={`w-full border px-4 py-3 text-left transition ${
                        state.available
                          ? "border-neutral-700/90 bg-black/40 hover:border-[var(--terminal)]/55 hover:bg-black/65"
                          : "cursor-not-allowed border-neutral-800/80 bg-black/20 opacity-55"
                      }`}
                    >
                      <p className="text-sm leading-relaxed text-neutral-200">{optionText}</p>
                      {!state.available && fail.length ? (
                        <p id={`${option.id}-why`} className="mt-2 text-[11px] text-neutral-500">
                          {fail[0]}
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {pendingNextChapter ? (
                <div className="flex flex-wrap gap-2 border-t border-white/[0.04] pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (transitionLockRef.current) return;
                      transitionLockRef.current = true;
                      const target = pendingNextChapter;
                      const targetStart = getSoloChapter(target)?.startSceneId;
                      if (!targetStart) {
                        transitionLockRef.current = false;
                        return;
                      }
                      const backSnap = { chapterId: progress.chapterId, sceneId: progress.sceneId };
                      const prevStack = progress.soloSceneBackStack ?? [];
                      const next: SoloProgress = {
                        ...progress,
                        chapterId: target,
                        sceneId: targetStart,
                        visitedSceneIds: Array.from(new Set([...(progress.visitedSceneIds ?? []), targetStart])),
                        soloSceneBackStack: [...prevStack, backSnap].slice(-SOLO_BACK_STACK_LIMIT),
                        updatedAt: progress.updatedAt + 1,
                      };
                      saveSoloProgress(next);
                      setProgress(next);
                    }}
                    className="border border-neutral-700 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-neutral-400 hover:border-neutral-500"
                  >
                    Continuar en {pendingNextChapter}
                  </button>
                  <button
                    type="button"
                    onClick={() => onExit()}
                    className="border border-[var(--terminal)]/35 bg-neutral-950/80 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-[var(--terminal)]"
                  >
                    Volver al Nexo
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
