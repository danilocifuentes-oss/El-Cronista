"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CharacterSheet, ClanId } from "@/lib/character";
import { CLAN_OPTIONS } from "@/lib/character";
import { disciplineLabel } from "@/lib/sereno";
import { getSoloChapter, getSoloScene } from "@/lib/soloCampaign/chapters";
import { checkOptionAvailability, listFailReasons, resolveDisciplineTierText } from "@/lib/soloCampaign/requirementEngine";
import { filterSoloOptionsForSheet, sortSoloOptionsForDisplay } from "@/lib/soloCampaign/optionPresentation";
import { saveSheet } from "@/lib/character";
import { loadSoloProgress, saveSoloProgress } from "@/lib/soloCampaign/progressStore";
import type { SoloOption, SoloProgress, SoloSceneEffect } from "@/lib/soloCampaign/types";
import { soloDisciplineGlyph } from "@/lib/soloCampaign/disciplineGlyphs";
import {
  CHRONICLE_PRELUDE_COMMON,
  CHRONICLE_PRELUDE_CONTENT_VERSION,
  CHRONICLE_PRELUDE_MASK_STINGER,
} from "@/lib/soloCampaign/preludeCopy";
import {
  getSoloChapterContextBlock,
  isSoloChapterContextDismissed,
} from "@/lib/soloCampaign/chapterContextCopy";
import { getPendingNextChapter } from "@/lib/soloCampaign/soloProgressSelectors";
import { syncActiveBundleFromGlobals } from "@/lib/profileStore";
import { NexusLibrary } from "@/components/icons/NexusLibrary";
import { SoloCampaignProvider, useSoloCampaign } from "@/context/SoloCampaignContext";
import { rollPoolV5, summarizeRollPlayerLog } from "@/lib/dice";

const OPTION_TYPE_LABEL: Record<string, string> = {
  discipline: "DISCIPLINA",
  skill: "HABILIDAD",
  clan: "CLAN",
};

const SOLO_BACK_STACK_LIMIT = 120;

function soloOptionUsesDice(option: SoloOption): boolean {
  return option.requirement.type !== "none";
}

function sumReputationDeltas(list: SoloOption["effects"]): number {
  if (!list?.length) return 0;
  return list.reduce((acc, e) => (e.type === "reputationDelta" ? acc + e.delta : acc), 0);
}

const DISCIPLINE_COLOR: Record<string, string> = {
  dominate: "text-violet-300 border-violet-700/60 bg-violet-950/25",
  presence: "text-blue-300 border-blue-700/60 bg-blue-950/25",
  auspex: "text-fuchsia-300 border-fuchsia-700/60 bg-fuchsia-950/25",
  celerity: "text-red-300 border-red-700/60 bg-red-950/25",
  potence: "text-red-300 border-red-700/60 bg-red-950/25",
  obfuscate: "text-slate-300 border-slate-600/60 bg-slate-900/20",
  fortitude: "text-emerald-300 border-emerald-700/60 bg-emerald-950/25",
  protean: "text-amber-300 border-amber-700/60 bg-amber-950/25",
  blood_sorcery: "text-indigo-300 border-indigo-700/60 bg-indigo-950/25",
  animalism: "text-lime-300 border-lime-700/60 bg-lime-950/25",
};

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

export function SoloCampaignApp({ profileId, sheet, onExit }: Props) {
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
            Tu personaje es <span className="text-neutral-200">{clanLabel}</span>. La crónica solitaria actual solo está
            implementada para <span className="text-neutral-200">Brujah</span>, <span className="text-neutral-200">Ventrue</span>,{" "}
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
      <SoloCampaignScreen profileId={profileId} sheet={sheet} onExit={onExit} />
    </SoloCampaignProvider>
  );
}

function SoloCampaignScreen({ profileId, sheet, onExit }: Props) {
  const { progress, setProgress } = useSoloCampaign();
  const transitionLockRef = useRef(false);
  const [lastRollLine, setLastRollLine] = useState<string>("");

  useEffect(() => {
    transitionLockRef.current = false;
  }, [progress.sceneId, progress.chapterId]);
  const chapter = useMemo(() => getSoloChapter(progress.chapterId), [progress.chapterId]);
  const scene = useMemo(() => getSoloScene(progress.chapterId, progress.sceneId), [progress.chapterId, progress.sceneId]);
  const displayedOptions = useMemo(() => {
    if (!scene) return [];
    return sortSoloOptionsForDisplay(filterSoloOptionsForSheet(scene.options, sheet));
  }, [scene, sheet]);
  const gatedOptionsWereHidden = Boolean(scene && displayedOptions.length < scene.options.length);
  const chapterContextBlock = getSoloChapterContextBlock(progress.chapterId);
  const clanIntroGateDone = progress.chapterId !== "chapter01" || progress.flags.clan_intro_seen === true;
  const chapterContextGateDone = isSoloChapterContextDismissed(progress, progress.chapterId);
  const pendingNextChapter = getPendingNextChapter(progress);
  const clanLabel = CLAN_OPTIONS.find((c) => c.id === sheet.clan)?.label ?? sheet.clan;
  const preludeStinger =
    CHRONICLE_PRELUDE_MASK_STINGER[sheet.clan] ??
    "Su máscara es la cara que decide financiar hasta que algún testigo cobre en otra moneda.";

  const clanIntro = {
    brujah: "La ciudad lo conoce por la rabia que camina con él. Esta noche esa rabia puede salvarlo o condenarlo.",
    ventrue: "El poder no se negocia; se administra. Esta noche su linaje le abre puertas y le gana enemigos.",
    malkavian:
      "Las grietas del mundo le hablan. Lo que para otros es ruido, para él es mapa.",
    toreador: "Cada escena tiene un precio estético y moral. Su mirada elige qué belleza sobrevive.",
    nosferatu: "Ve la red bajo la red. Nadie domina la noche sin pasar por sus túneles.",
    tremere: "Cada decisión es un ritual sin círculo: sangre, control y consecuencias calculadas.",
    gangrel: "Su instinto lee la noche antes que los datos. La bestia es brújula si no la suelta.",
    thin_blood: "Su sangre cuestiona el orden no escrito. Aprende rápido o queda fuera.",
    caitiff: "Sin apellido inmortal, cada paso debe ganarlo desde cero.",
    other: "Su linaje irregular no lo protege: lo obliga a improvisar mejor que nadie.",
  }[sheet.clan];

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


    if (soloOptionUsesDice(option)) {
      const rollPlan = resolveSoloRollPlan(option, sheet);
      const roll = rollPoolV5(rollPlan.pool, sheet.hunger, rollPlan.difficulty);
      rollLine = `${rollPlan.label} · ${summarizeRollPlayerLog(roll)}`;
      rollPassed = roll.passed;
      const isCritical = roll.criticalNormal || roll.messyCritical;
      branchEffects = roll.passed
        ? isCritical
          ? [...(option.effects ?? []), ...(option.effectsOnCritical ?? [])]
          : option.effects ?? []
        : [...(option.effects ?? []), ...(option.effectsOnFail ?? [])];
      for (const effect of branchEffects) {
        nextSheet = applySceneEffectDraft(nextSheet, nextFlags, effect);
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
      rollLine = "Sin tirada · elección directa";
      branchEffects = option.effects ?? [];
      for (const effect of branchEffects) {
        nextSheet = applySceneEffectDraft(nextSheet, nextFlags, effect);
      }
    }

    setLastRollLine(rollLine);

    if (nextSheet !== sheet) {
      saveSheet(nextSheet);
      syncActiveBundleFromGlobals(profileId);
    }
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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0f1118_0%,#050505_45%,#030303_100%)] px-4 py-8 font-mono text-neutral-300">
      <div className="mx-auto grid max-w-6xl gap-5 xl:grid-cols-[18rem_1fr]">
        <aside
          className="space-y-4 border border-neutral-900 bg-black/35 p-4"
          aria-label="Estado del personaje en Campaña Solitaria"
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--terminal)]">Ficha activa</p>
          <p className="font-sans text-lg text-neutral-100">{sheet.name || "Sin nombre"}</p>
          <p className={`text-xs uppercase tracking-[0.16em] ${CLAN_TONE[sheet.clan] ?? "text-neutral-300"}`}>{clanLabel}</p>
          <div className="space-y-2 border-t border-neutral-900 pt-3 text-xs text-neutral-500">
            <p className="font-mono">Humanidad · {sheet.humanity}</p>
            <p className="flex items-center gap-2">
              <NexusLibrary.Sangre className="h-4 w-4 shrink-0" pulse={sheet.hunger > 2} />
              <span>Hambre · {sheet.hunger}</span>
            </p>
            <p>Reputación · {progress.reputation}</p>
            <p>Capítulo · {chapter.title}</p>
            <p>Decisiones · {progress.decisionHistory.length}</p>
          </div>
          {(progress.soloSceneBackStack?.length ?? 0) > 0 ? (
            <div className="mt-2 space-y-2 border-t border-neutral-900 pt-3">
              <button
                type="button"
                onClick={() => revertToPrevScene()}
                className="w-full border border-dashed border-amber-800/70 bg-amber-950/20 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-amber-200"
              >
                ← Escena anterior (beta QA)
              </button>
              <p className="text-[10px] leading-snug text-neutral-600">
                El retroceso no restaura tiradas, sangre ni marcas en ficha: solo la escena (y quita la última decisión si
                corresponde).
              </p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={onExit}
            className="mt-2 w-full border border-neutral-700 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-neutral-300"
          >
            Volver al Nexo
          </button>
        </aside>

        <main className="space-y-6 min-w-0" aria-label="Historia y opciones">
        <header className="space-y-2 border-b border-neutral-900 pb-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--terminal)]">Campaña Solitaria</p>
          <h1 className="font-sans text-2xl font-semibold text-neutral-100">{chapter.title}</h1>
          <p className="text-sm text-neutral-500">{chapter.description}</p>
          <p className="text-xs text-neutral-500">
            {sheet.name || "Sin nombre"} · <span className={CLAN_TONE[sheet.clan] ?? "text-neutral-300"}>{clanLabel}</span>
          </p>
        </header>

        {!isChroniclePreludeDismissed(progress) ? (
          <section className="space-y-4 border border-[var(--terminal)]/25 bg-black/55 p-5 sharp-border-inner">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--terminal)]">Preludio de crónica</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-300">{CHRONICLE_PRELUDE_COMMON}</p>
            <p className={`text-sm leading-relaxed italic ${CLAN_TONE[sheet.clan] ?? "text-neutral-200"}`}>{preludeStinger}</p>
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
              Comenzar con esta voz
            </button>
          </section>
        ) : null}

        {isChroniclePreludeDismissed(progress) && progress.chapterId === "chapter01" && !progress.flags.clan_intro_seen ? (
          <section className="space-y-4 border border-neutral-900 bg-black/45 p-5 sharp-border-inner">
            <p className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">Introducción de clan</p>
            <p className={`text-sm leading-relaxed ${CLAN_TONE[sheet.clan] ?? "text-neutral-200"}`}>{clanIntro}</p>
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
              Entrar en escena
            </button>
          </section>
        ) : null}

        {isChroniclePreludeDismissed(progress) &&
        clanIntroGateDone &&
        chapterContextBlock &&
        !chapterContextGateDone ? (
          <section className="space-y-4 border border-[var(--terminal)]/20 bg-black/50 p-5 sharp-border-inner">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--terminal)]">Contexto de capítulo</p>
            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">{chapterContextBlock.label}</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-300">{chapterContextBlock.body}</p>
            <button
              type="button"
              onClick={() => {
                const nextBlock = chapterContextBlock;
                const next: SoloProgress = {
                  ...progress,
                  chapterContextSeen: {
                    ...(progress.chapterContextSeen ?? {}),
                    [progress.chapterId]: nextBlock.contentVersion,
                  },
                  updatedAt: progress.updatedAt + 1,
                };
                saveSoloProgress(next);
                setProgress(next);
              }}
              className="border border-[var(--terminal)]/40 bg-neutral-950/80 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--terminal)]"
            >
              Comenzar la narración
            </button>
          </section>
        ) : null}

        {isChroniclePreludeDismissed(progress) && clanIntroGateDone && chapterContextGateDone ? (
          <>
            <section className="space-y-4 border border-neutral-900 bg-black/40 p-5 sharp-border-inner" aria-labelledby={sceneHeadingId}>
              <p id={sceneHeadingId} className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">
                {scene.title}
              </p>
              <p className="leading-relaxed text-neutral-200">{scene.text}</p>
              {scene.clanFlavor?.[sheet.clan] ? (
                <p className={`border-l-2 border-current pl-3 text-sm italic ${CLAN_TONE[sheet.clan] ?? "text-neutral-300"}`}>
                  {scene.clanFlavor[sheet.clan]}
                </p>
              ) : null}
            </section>

            {lastRollLine ? (
              <section className="border border-neutral-900 bg-black/35 px-4 py-3">
                <div className="flex items-start gap-2">
                  <NexusLibrary.Destino className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--terminal)] opacity-85" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Tirada reciente</p>
                    <p className="mt-1 text-xs text-neutral-300">{lastRollLine}</p>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="space-y-3">
              {gatedOptionsWereHidden ? (
                <p className="rounded border border-neutral-800 bg-black/30 px-3 py-2 text-xs leading-relaxed text-neutral-500">
                  Algunos caminos con tirada no se muestran porque tu Codex no alcanza aún ese requisito (disciplina, clan…).
                  Sigues teniendo todas las rutas narrativas de diálogo; las mecánicas aparecen sólo cuando la ficha califica.
                </p>
              ) : null}
              {displayedOptions.map((option) => {
                const state = checkOptionAvailability(option, sheet);
                const fail = listFailReasons(option, sheet);
                const optionText = resolveDisciplineTierText(option, sheet);
                const disciplineChip = option.discipline ? DISCIPLINE_COLOR[option.discipline] ?? "text-violet-200 border-violet-900" : "";

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
                    aria-label={state.available ? choiceLabel : `${choiceLabel} (no disponible)`}
                    onClick={() => applyOption(option)}
                    className={`w-full border px-4 py-3 text-left transition ${
                      state.available
                        ? "border-neutral-700 bg-black/35 hover:border-[var(--terminal)]/70 hover:bg-black/60"
                        : "cursor-not-allowed border-neutral-800 bg-black/25 opacity-60"
                    }`}
                  >
                    {(option.type !== "dialogue" && typeLine) || option.discipline ? (
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
                        {option.type !== "dialogue" && typeLine ? (
                          <span className="border border-neutral-700 px-2 py-0.5 text-neutral-400">[{typeLine}]</span>
                        ) : null}
                        {option.discipline ? (
                          <span className={`border px-2 py-0.5 ${disciplineChip}`}>
                            [{soloDisciplineGlyph(option.discipline)} {option.disciplineTitle ?? disciplineLabel(option.discipline)}]
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    <p className="text-sm leading-relaxed text-neutral-200">{optionText}</p>
                    {!state.available && fail.length ? <p className="mt-2 text-xs text-amber-300">Requisito: {fail[0]}</p> : null}
                  </button>
                );
              })}
            </section>

            {pendingNextChapter ? (
              <section className="space-y-3 border border-[var(--terminal)]/20 bg-black/50 p-4 sharp-border-inner">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--terminal)]">Capítulo registrado</p>
                <p className="text-sm text-neutral-400">
                  Tu decisión cerró este tramo. Puedes avanzar al próximo capítulo o volver al Nexo.
                </p>
                <div className="flex flex-wrap gap-2">
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
                    className="border border-neutral-700 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-neutral-400"
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
                <p className="text-xs text-neutral-500">
                  Verás primero el <span className="text-neutral-400">contexto</span> del próximo capítulo y luego arranca la narración.
                </p>
              </section>
            ) : null}

            <footer className="flex flex-wrap gap-3 border-t border-neutral-900 pt-4">
              <p className="text-xs text-neutral-600">
                Escena {progress.sceneId} · vistas {progress.visitedSceneIds.length}
              </p>
            </footer>
          </>
        ) : null}
        </main>
      </div>
    </div>
  );
}
