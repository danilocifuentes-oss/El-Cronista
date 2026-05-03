"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  CLAN_ACCENTS,
  CLAN_OPTIONS,
  emptySheet,
  loadSheet,
  normalizeCharacterSheet,
  saveSheet,
  type CharacterSheet,
} from "@/lib/character";
import { askCronista } from "@/lib/narrativeApi";
import {
  appendMjDirective,
  filterLogsByStrand,
  loadActiveStrand,
  saveActiveStrand,
  loadIdeasRepository,
  loadMjDirectives,
  loadNarrativeLog,
  loadRollingByStrand,
  loadRollingSummary,
  resetNarrativeChannel,
  recentLinesForStrand,
  saveIdeasRepository,
  saveNarrativeLog,
  saveRollingSummary,
  type NarrativeResetOptions,
} from "@/lib/narrativeMemory";
import { buildCrossStrandContext, STRAND_LABEL, type NarrativeStrand } from "@/lib/narrativeStrands";
import { consumePendingSynapticDisruption, loadChronicle, peekPendingSynapticDisruption } from "@/lib/chronicleConfig";
import {
  appendXpLog,
  loadMeta,
  loadXpLog,
  saveMeta,
} from "@/lib/sessionMeta";
import {
  completeImpulseSpend,
  letargoPoolPenalty,
  tickImpulseRefill,
  touchSignificantAction,
} from "@/lib/impulseUnits";
import { formatNexoApiFailure } from "@/lib/nexoErrors";
import { buildSheetSummaryLite } from "@/lib/sheetSummary";
import type { NarrativeLogEntry } from "@/lib/narrativeTypes";
import { CharacterCreation } from "./CharacterCreation";
import { CharacterStatusPanel } from "./CharacterStatusPanel";
import type { ConclaveMate } from "./ConclavePanel";
import { ConclavePanel } from "./ConclavePanel";
import { AdminConsole } from "./AdminConsole";
import { NarrativeFlow } from "./NarrativeFlow";
import { SidebarMesa } from "./SidebarMesa";
import { NexoChronicaRail } from "./NexoChronicaRail";
import { SchreckNetLogin } from "./SchreckNetLogin";
import { GameSessionProvider, useGameSession } from "@/context/GameSessionContext";
import { ManifestWill } from "./ManifestWill";
import { ForcedDestinyOverlay } from "./ForcedDestinyOverlay";
import { TechnicalHud } from "./TechnicalHud";
import { streamCronistaMotorWithFallback } from "@/lib/cronistaClient";
import { serializeV5Roll, type V5RollResult } from "@/lib/dice";
import {
  createBlankProfile,
  ensureShadowPackNpcs,
  getActiveProfileId,
  listProfiles,
  migrateLegacyToProfiles,
  selectProfile,
  syncActiveBundleFromGlobals,
} from "@/lib/profileStore";
import { ProfileHub } from "./ProfileHub";
import { NarratorCommandCenter } from "./NarratorCommandCenter";
import { NarrativeMemoryPanel } from "./NarrativeMemoryPanel";
import type { Phase } from "@/lib/schreckPhase";
import {
  clearSchreckAuth,
  phaseToHref,
  queryParamToPhase,
  readAuthRole,
  writeAuthRole,
} from "@/lib/schreckNavigation";

const HEALTH_MAX_UI = 7;

const MOCK_CONCLAVE: ConclaveMate[] = [
  { id: "1", name: "Mireya V.", clan: "Tremere", status: "refugio" },
  { id: "2", name: "_nullface", clan: "Nosferatu", status: "caceria" },
  { id: "3", name: "Elías K.", clan: "Brujah", status: "conclave" },
];

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function famineSealWallClock(): number {
  return Date.now();
}

const BOOT_STREAM: NarrativeLogEntry = {
  id: "0",
  role: "sistema",
  text: "[BOOT]: Nexo_standby · buffer vacío.",
  ts: 0,
  strand: "principal",
};

function mergeStoredSheet(raw: CharacterSheet): CharacterSheet {
  return normalizeCharacterSheet(raw);
}

function persistActiveProfile(): void {
  const aid = getActiveProfileId();
  if (aid) syncActiveBundleFromGlobals(aid);
}

function applyGlobalsToUi(
  setSheet: (s: CharacterSheet) => void,
  setSheetLocked: (v: boolean) => void,
  setLogs: (v: NarrativeLogEntry[] | ((p: NarrativeLogEntry[]) => NarrativeLogEntry[])) => void,
  refreshXpLog: () => void,
  setIdeasRepo?: (s: string) => void,
  commitStrand?: (s: NarrativeStrand) => void,
) {
  const stored = loadSheet();
  if (stored) setSheet(mergeStoredSheet(stored));
  setSheetLocked(loadMeta().sheetLocked);
  const nar = loadNarrativeLog();
  setLogs(nar.length > 0 ? nar : [BOOT_STREAM]);
  refreshXpLog();
  setIdeasRepo?.(loadIdeasRepository());
  commitStrand?.(loadActiveStrand());
}

export default function CronistaApp() {
  return (
    <GameSessionProvider>
      <CronistaAppInner />
    </GameSessionProvider>
  );
}

function CronistaAppInner() {
  const [phase, setPhase] = useState<Phase>("login");
  const [sheet, setSheet] = useState<CharacterSheet>(() => emptySheet());
  const [sheetLocked, setSheetLocked] = useState<boolean>(() =>
    typeof window === "undefined" ? false : loadMeta().sheetLocked,
  );
  const [logs, setLogs] = useState<NarrativeLogEntry[]>(() => [BOOT_STREAM]);
  const logsRef = useRef(logs);
  const [beastPulse, setBeastPulse] = useState(false);
  const [cronistaProcessing, setCronistaProcessing] = useState(false);
  const [composer, setComposer] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [inquisitionThreat, setInquisitionThreat] = useState(2);
  const [mjCmd, setMjCmd] = useState("");
  const [xpLog, setXpLog] = useState(() =>
    typeof window === "undefined" ? [] : loadXpLog(),
  );
  const [profileIndexTick, setProfileIndexTick] = useState(0);
  /** Re-render impulsos / letargo tras gastar o pasar el ciclo. */
  const [impulseRev, setImpulseRev] = useState(0);
  const [ideasRepo, setIdeasRepo] = useState("");
  const [activeStrand, setActiveStrand] = useState<NarrativeStrand>(() =>
    typeof window === "undefined" ? "principal" : loadActiveStrand(),
  );
  const activeStrandRef = useRef<NarrativeStrand>(
    typeof window === "undefined" ? "principal" : loadActiveStrand(),
  );

  const commitStrand = useCallback((s: NarrativeStrand) => {
    activeStrandRef.current = s;
    setActiveStrand(s);
    saveActiveStrand(s);
    const aid = getActiveProfileId();
    if (aid) queueMicrotask(() => syncActiveBundleFromGlobals(aid));
  }, []);

  /** Navega y escribe entrada en historial (`?v=`) para atrás/adelante en el mismo origen. */
  const navigateToPhase = useCallback((next: Phase, opts?: { replace?: boolean }) => {
    if (typeof window !== "undefined") {
      const href = phaseToHref(next);
      if (opts?.replace) {
        window.history.replaceState({ phase: next }, "", href);
      } else {
        window.history.pushState({ phase: next }, "", href);
      }
    }
    setPhase(next);
  }, []);

  const historyBootRef = useRef(false);

  const {
    isNarrator,
    setIsNarrator,
    famineIntervalMinutes,
    setFamineIntervalMinutes: setFamineIntervalMinutesCtx,
    rollDifficulty,
    setRollDifficulty,
    forcedRoll,
    requestForcedRoll,
    clearForcedRoll,
  } = useGameSession();

  const accent = useMemo(() => CLAN_ACCENTS[sheet.clan], [sheet.clan]);

  const clanLabelDisplay = useMemo(
    () => CLAN_OPTIONS.find((c) => c.id === sheet.clan)?.label ?? sheet.clan,
    [sheet.clan],
  );
  const identityHint = `${sheet.name?.trim() || "Sin nombre"} · ${clanLabelDisplay}`;

  /** Normalización estable para la vista HOJA (matriz CODEX completa, solo lectura). */
  const sheetReviewInitial = useMemo(() => mergeStoredSheet(sheet), [sheet]);
  /** Remount cuando cambia la ficha (evita estado obsoleto sin effect en CharacterCreation). */
  const sheetReviewKey = useMemo(() => JSON.stringify(sheetReviewInitial), [sheetReviewInitial]);

  const hubProfiles = useMemo(() => {
    void profileIndexTick;
    return listProfiles();
  }, [profileIndexTick]);

  const refreshXpLog = useCallback(() => setXpLog(loadXpLog()), []);

  const displayLogs = useMemo(() => filterLogsByStrand(logs, activeStrand), [logs, activeStrand]);

  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  useEffect(() => {
    setIdeasRepo(loadIdeasRepository());
  }, []);

  useEffect(() => {
    const saved = loadNarrativeLog();
    if (saved.length === 0) return;
    queueMicrotask(() => {
      setLogs(saved);
    });
  }, []);

  /** Primera carga cliente: reconciliar `?v=` con sesión y roles. */
  useEffect(() => {
    if (historyBootRef.current) return;
    historyBootRef.current = true;
    if (typeof window === "undefined") return;

    const role = readAuthRole();
    const vRaw = new URLSearchParams(window.location.search).get("v");
    const fromUrl = queryParamToPhase(vRaw);

    if (!role) {
      if (vRaw) window.history.replaceState(null, "", "/");
      setPhase("login");
      setIsNarrator(false);
      return;
    }

    const narrator = role === "narrator";
    setIsNarrator(narrator);

    let target: Phase = fromUrl ?? (narrator ? "commandCenter" : "profileHub");

    if (target === "commandCenter" && !narrator) target = "profileHub";
    if (target === "nexus" && !narrator && !getActiveProfileId()) target = "profileHub";

    const hrefWant = phaseToHref(target);
    if (`${window.location.pathname}${window.location.search}` !== hrefWant) {
      window.history.replaceState({ phase: target }, "", hrefWant);
    }
    setPhase(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- arranque único del historial Nexo
  }, []);

  useEffect(() => {
    function syncFromHistory() {
      const vRaw = new URLSearchParams(window.location.search).get("v");
      if (!vRaw) {
        clearSchreckAuth();
        setIsNarrator(false);
        setPhase("login");
        return;
      }
      const fromUrl = queryParamToPhase(vRaw);
      const role = readAuthRole();
      if (!fromUrl || !role) {
        window.history.replaceState(null, "", "/");
        clearSchreckAuth();
        setIsNarrator(false);
        setPhase("login");
        return;
      }

      const narrator = role === "narrator";
      setIsNarrator(narrator);

      let target: Phase = fromUrl;

      if (target === "commandCenter" && !narrator) {
        window.history.replaceState({ phase: "profileHub" }, "", phaseToHref("profileHub"));
        target = "profileHub";
      } else if (target === "nexus" && !narrator && !getActiveProfileId()) {
        window.history.replaceState({ phase: "profileHub" }, "", phaseToHref("profileHub"));
        target = "profileHub";
      }

      setPhase(target);
    }

    window.addEventListener("popstate", syncFromHistory);
    return () => window.removeEventListener("popstate", syncFromHistory);
  }, [setIsNarrator]);

  useEffect(() => {
    if (phase !== "nexus") return;
    const m = loadMeta();
    setFamineIntervalMinutesCtx(
      typeof m.famineIntervalMinutes === "number"
        ? Math.max(5, Math.min(240, m.famineIntervalMinutes))
        : 60,
    );
  }, [phase, setFamineIntervalMinutesCtx]);

  useEffect(() => {
    if (phase !== "nexus") return;
    const sync = () => {
      const next = tickImpulseRefill(loadMeta());
      saveMeta(next);
      const aid = getActiveProfileId();
      if (aid) syncActiveBundleFromGlobals(aid);
      setImpulseRev((n) => n + 1);
    };
    sync();
    const id = window.setInterval(sync, 60_000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (!beastPulse) return;
    const t = window.setTimeout(() => setBeastPulse(false), 14000);
    return () => window.clearTimeout(t);
  }, [beastPulse]);

  const handleSheetMutation = useCallback(
    (next: CharacterSheet, logLine?: string) => {
      saveSheet(next);
      setSheet(next);
      const lockedNow = typeof window !== "undefined" ? loadMeta().sheetLocked : false;
      if (lockedNow && logLine) {
        appendXpLog(logLine);
        refreshXpLog();
      }
      const aid = getActiveProfileId();
      if (aid) syncActiveBundleFromGlobals(aid);
    },
    [refreshXpLog],
  );

  const applyLogin = () => {
    migrateLegacyToProfiles();
    writeAuthRole("player");
    setIsNarrator(false);
    navigateToPhase("profileHub");
  };

  const applyRootAccess = () => {
    migrateLegacyToProfiles();
    writeAuthRole("narrator");
    setIsNarrator(true);
    ensureShadowPackNpcs();
    setProfileIndexTick((n) => n + 1);
    navigateToPhase("commandCenter");
  };

  const finishChargen = (w: CharacterSheet) => {
    const finalized = normalizeCharacterSheet(w);
    saveSheet(finalized);
    setSheet(finalized);
    const meta = loadMeta();
    const firstSeal = !meta.sheetLocked;
    saveMeta({
      ...meta,
      sheetLocked: true,
      lastFamineTickAt: firstSeal ? famineSealWallClock() : meta.lastFamineTickAt,
    });
    appendXpLog(
      firstSeal ? `[CODEX_COMMIT]: ${finalized.name || "NULL"}` : `[CODEX_RELAY]: MJ · ${finalized.name || "NULL"}`,
    );
    setSheetLocked(true);
    refreshXpLog();
    navigateToPhase("nexus");
    pushLog({
      role: "sistema",
      text: "[STATE_LOCK]: CODEX cerrado (`cronista-sheet-v1`) · cambios solo si el narrador los audita.",
    });
    const aid = getActiveProfileId();
    if (aid) syncActiveBundleFromGlobals(aid);
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      const meta = loadMeta();
      const intervalMs = meta.famineIntervalMinutes * 60_000;
      if (intervalMs <= 0) return;
      if (Date.now() - meta.lastFamineTickAt < intervalMs) return;

      const current = loadSheet();
      if (!current) return;

      if (current.hunger >= 5) {
        saveMeta({ ...meta, lastFamineTickAt: Date.now() });
        return;
      }

      const nextHunger = Math.min(5, current.hunger + 1);
      const nextSheet = { ...current, hunger: nextHunger };
      saveSheet(nextSheet);
      setSheet(nextSheet);
      saveMeta({ ...meta, lastFamineTickAt: Date.now() });
      appendXpLog(`[CLOCK_TICK]: Σh+1 → ${nextHunger}/5`);
      refreshXpLog();
    }, 45000);

    return () => window.clearInterval(id);
  }, [refreshXpLog]);

  function pushLog(part: Omit<NarrativeLogEntry, "id" | "ts"> & { ts?: number }) {
    const strand = part.strand ?? activeStrandRef.current;
    const entry: NarrativeLogEntry = {
      id: uid(),
      ts: part.ts ?? Date.now(),
      role: part.role,
      text: part.text,
      strand,
      ...(part.cronistaOut ? { cronistaOut: true } : {}),
      ...(Array.isArray(part.suggestions) && part.suggestions.length
        ? { suggestions: part.suggestions.slice(0, 8) }
        : {}),
    };
    setLogs((prev) => {
      const next = [...prev, entry];
      saveNarrativeLog(next);
      queueMicrotask(() => {
        const aid = getActiveProfileId();
        if (aid) syncActiveBundleFromGlobals(aid);
      });
      return next;
    });
  }

  const handleIdeasChange = useCallback((next: string) => {
    setIdeasRepo(next);
    saveIdeasRepository(next);
    const aid = getActiveProfileId();
    if (aid) syncActiveBundleFromGlobals(aid);
  }, []);

  const handleNarrativeReset = useCallback((opts: NarrativeResetOptions) => {
    const next = resetNarrativeChannel(opts);
    setLogs(next);
    if (opts.clearIdeas) setIdeasRepo("");
    queueMicrotask(() => {
      const aid = getActiveProfileId();
      if (aid) syncActiveBundleFromGlobals(aid);
    });
  }, []);

  const nuevaEscenaHiloActivo = useCallback(() => {
    const label = STRAND_LABEL[activeStrand];
    if (
      !window.confirm(
        `¿Reiniciar el buffer del hilo «${label}»? Se mantienen la ficha, Génesis y otros hilos; se vacía el resumen solo de este hilo.`,
      )
    ) {
      return;
    }
    handleNarrativeReset({ strandOnly: activeStrand });
  }, [activeStrand, handleNarrativeReset]);

  const genesisSnap = useMemo(() => loadChronicle(), [logs.length, profileIndexTick]);
  const rollingSnap = useMemo(() => loadRollingSummary(), [logs, activeStrand, impulseRev]);
  const pendingSynapticPreview = peekPendingSynapticDisruption()?.trim() ?? "";

  const chronicaRailProps = {
    chronicle: genesisSnap,
    activeStrand,
    inquisitionThreat,
    rollingSummary: rollingSnap,
    pendingSynaptic: pendingSynapticPreview,
  } as const;

  const sendPlayer = async () => {
    const t = composer.trim();
    if (!t) return;
    setComposer("");
    pushLog({ role: "jugador", text: t });

    const strand = activeStrandRef.current;
    const prior = recentLinesForStrand(logs, strand, 4);
    const recentLogs = [...prior, { role: "jugador" as const, text: t }].slice(-5);
    const cross = buildCrossStrandContext(strand, loadRollingByStrand());

    try {
      const out = await askCronista({
        playerAction: t,
        recentLogs,
        sheetSummary: buildSheetSummaryLite(sheet),
        inquisitionThreat,
        mjDirectives: loadMjDirectives(),
        rollingSummary: loadRollingSummary() || undefined,
        chronicle: loadChronicle(),
        synapticDisruption: consumePendingSynapticDisruption() || undefined,
        ideasRepository: ideasRepo.trim() || undefined,
        narrativeStrand: strand,
        crossStrandContext: cross.trim() || undefined,
      });
      pushLog({
        role: "narrador",
        text: out.narration,
        ...(out.suggestions?.length ? { suggestions: out.suggestions } : {}),
      });
      if (out.rollingSummary) saveRollingSummary(out.rollingSummary);
      saveMeta(touchSignificantAction(loadMeta()));
      const aid = getActiveProfileId();
      if (aid) syncActiveBundleFromGlobals(aid);
      setImpulseRev((n) => n + 1);
    } catch (e) {
      pushLog({
        role: "sistema",
        text: formatNexoApiFailure(e instanceof Error ? e.message : String(e)),
      });
    }
  };

  const emitMj = () => {
    const cmd = mjCmd.trim();
    if (!cmd || !isNarrator) return;
    appendMjDirective(cmd);
    pushLog({ role: "sistema", text: `[MJ_PIPE]: ${cmd}` });
    setMjCmd("");
    setAdminOpen(false);
  };

  const handleManifestMotor = useCallback(
    async ({ roll, intent, ledgerLine }: { roll: V5RollResult; intent: string; ledgerLine: string }) => {
      if (!isNarrator) {
        const metaNow = tickImpulseRefill(loadMeta());
        if (metaNow.impulseUnits <= 0) {
          pushLog({
            role: "sistema",
            text: "[IMPULSE_LOCK]: Sin Unidades de Impulso — espera el ciclo de 24 h o mantén actividad en el canal.",
          });
          return;
        }
        saveMeta(completeImpulseSpend(metaNow));
        const aid0 = getActiveProfileId();
        if (aid0) syncActiveBundleFromGlobals(aid0);
        setImpulseRev((n) => n + 1);
      }

      pushLog({ role: "sistema", text: ledgerLine });
      if (roll.fracasoBestial || sheet.hunger >= 5) setBeastPulse(true);

      const streamId = uid();
      const strand = activeStrandRef.current;
      setCronistaProcessing(true);
      setLogs((prev) => [
        ...prev,
        {
          id: streamId,
          role: "narrador",
          text: "",
          ts: Date.now(),
          cronistaOut: true,
          strand,
        },
      ]);

      const recentLogs = [
        ...recentLinesForStrand(logsRef.current, strand, 4),
        { role: "sistema", text: ledgerLine },
      ].slice(-5);
      const cross = buildCrossStrandContext(strand, loadRollingByStrand());

      try {
        let acc = "";
        await streamCronistaMotorWithFallback(
          {
            codex: sheet,
            tirada: serializeV5Roll(roll),
            hambre: sheet.hunger,
            input: intent,
            recentLogs,
            chronicle: loadChronicle(),
            synapticDisruption: peekPendingSynapticDisruption() || undefined,
            ideasRepository: ideasRepo.trim() || undefined,
            narrativeStrand: strand,
            crossStrandContext: cross.trim() || undefined,
          },
          (delta) => {
            acc += delta;
            setLogs((prev) => prev.map((e) => (e.id === streamId ? { ...e, text: acc } : e)));
          },
        );
        const finalText = acc.trim() || "[SILENCIO_CRONISTA]";
        setLogs((prev) => {
          const next = prev.map((e) => (e.id === streamId ? { ...e, text: finalText } : e));
          saveNarrativeLog(next);
          queueMicrotask(() => {
            const aid = getActiveProfileId();
            if (aid) syncActiveBundleFromGlobals(aid);
          });
          return next;
        });
      } catch (e) {
        setLogs((prev) => prev.filter((e) => e.id !== streamId));
        pushLog({
          role: "sistema",
          text: formatNexoApiFailure(e instanceof Error ? e.message : String(e)),
        });
      } finally {
        setCronistaProcessing(false);
      }
    },
    [sheet, ideasRepo, isNarrator],
  );

  const tweakRemoteSimulation = () => {
    if (!isNarrator) return;
    handleSheetMutation({ ...sheet, hunger: Math.min(5, sheet.hunger + 1) }, "[SIM]: Σh+1");
  };

  const persistFamine = (minutes: number) => {
    const clamped = Math.max(5, Math.min(240, minutes));
    saveMeta({
      ...loadMeta(),
      famineIntervalMinutes: clamped,
    });
    setFamineIntervalMinutesCtx(clamped);
    appendXpLog(`[CLOCK_CONFIG]:Δ=${clamped}m`);
    refreshXpLog();
  };

  const ravenousVisual = sheet.hunger >= 5 || beastPulse;
  const mainFrameClass = ravenousVisual
    ? "flex min-h-screen flex-col crt-wrap ravenous-frame bg-black"
    : "flex min-h-screen flex-col bg-black";

  const impulseMeta = useMemo(() => {
    void impulseRev;
    return tickImpulseRefill(loadMeta());
  }, [impulseRev, phase]);

  const manifestPenalty = letargoPoolPenalty(impulseMeta);
  const impulseBlocked = !isNarrator && impulseMeta.impulseUnits <= 0;

  const goToLogin = () => {
    persistActiveProfile();
    clearSchreckAuth();
    setIsNarrator(false);
    navigateToPhase("login", { replace: true });
  };

  const goToProfileHub = () => {
    persistActiveProfile();
    navigateToPhase("profileHub");
  };

  const enterProfile = (id: string) => {
    if (!selectProfile(id)) return;
    applyGlobalsToUi(setSheet, setSheetLocked, setLogs, refreshXpLog, setIdeasRepo, commitStrand);
    navigateToPhase("nexus");
    pushLog({ role: "sistema", text: `[CV]: ${loadSheet()?.name || id}` });
  };

  const startBlankSheet = () => {
    createBlankProfile();
    applyGlobalsToUi(setSheet, setSheetLocked, setLogs, refreshXpLog, setIdeasRepo, commitStrand);
    navigateToPhase("chargen");
  };

  if (phase === "login") {
    return <SchreckNetLogin onAuthenticate={applyLogin} onRootAccess={applyRootAccess} />;
  }

  if (phase === "commandCenter") {
    return (
      <NarratorCommandCenter
        profiles={hubProfiles}
        onProfilesChange={() => setProfileIndexTick((n) => n + 1)}
        onGoHub={() => navigateToPhase("profileHub")}
        onGoNexus={() => {
          const id = getActiveProfileId();
          if (!id) {
            window.alert("No hay perfil activo. Abre REGISTRO_CV y selecciona un CV.");
            return;
          }
          if (!selectProfile(id)) return;
          applyGlobalsToUi(setSheet, setSheetLocked, setLogs, refreshXpLog, setIdeasRepo, commitStrand);
          navigateToPhase("nexus");
        }}
        onRefreshGlobals={() =>
          applyGlobalsToUi(setSheet, setSheetLocked, setLogs, refreshXpLog, setIdeasRepo, commitStrand)
        }
      />
    );
  }

  if (phase === "profileHub") {
    return (
      <ProfileHub
        profiles={hubProfiles}
        onPlayProfile={(id) => enterProfile(id)}
        onNewSheetBlank={startBlankSheet}
        onLogout={goToLogin}
      />
    );
  }

  if (phase === "chargen") {
    const meta = loadMeta();
    const stored = loadSheet();
    const blocked = meta.sheetLocked && !isNarrator && Boolean(stored?.name);
    if (blocked && stored) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#050505] px-8 text-center font-mono text-[10px] text-neutral-600">
          <p className="max-w-md border border-[#161616] bg-black/50 p-5 text-neutral-400">[LOCK]: CODEX_MJ_ONLY</p>
          <button
            type="button"
            onClick={() => {
              setSheet(mergeStoredSheet(stored));
              setSheetLocked(true);
              refreshXpLog();
              navigateToPhase("nexus", { replace: true });
            }}
            className="border border-[#333] px-8 py-2.5 font-mono text-[9px] uppercase tracking-[0.35em] text-neutral-400 hover:border-[var(--terminal)] hover:text-neutral-300"
          >
            [ROUTING_NEXO]
          </button>
        </div>
      );
    }

    const initialForChargen: CharacterSheet =
      meta.sheetLocked && isNarrator && stored
        ? mergeStoredSheet(stored)
        : !meta.sheetLocked && stored && stored.name?.trim()
          ? mergeStoredSheet(stored)
          : emptySheet();

    return <CharacterCreation initial={initialForChargen} onSave={(s) => finishChargen(s)} />;
  }

  const healthHudFilled =
    HEALTH_MAX_UI - Math.min(sheet.healthDamage, HEALTH_MAX_UI);

  if (phase === "sheetReview") {
    return (
      <div className="flex min-h-screen flex-col bg-black">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#222] bg-black px-4 py-3 font-mono text-[10px] text-neutral-400">
          <p className="tracking-[0.25em] text-[var(--terminal)]/90">{"//_CODEX · MATRIZ"}</p>
          <button
            type="button"
            onClick={() => navigateToPhase("nexus", { replace: true })}
            className="border border-[var(--terminal)]/35 px-4 py-2 text-[9px] uppercase tracking-widest text-[var(--terminal)] hover:bg-[var(--terminal)]/10"
          >
            Volver al Nexo
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto">
          <CharacterCreation
            key={sheetReviewKey}
            initial={sheetReviewInitial}
            onSave={() => {}}
            viewOnly
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${mainFrameClass} text-neutral-200`}
      style={{ ["--accent-clan"]: accent } as CSSProperties}
    >
      <ForcedDestinyOverlay
        forced={forcedRoll}
        sheet={sheet}
        hungerLevel={sheet.hunger}
        onConsume={(line) => {
          appendXpLog(line);
          refreshXpLog();
          pushLog({ role: "sistema", text: line });
          clearForcedRoll();
        }}
      />

      <header className="flex shrink-0 flex-col gap-3 border-b border-[#222] bg-black px-4 py-4 font-mono text-[10px] sm:gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-6">
        <div className="min-w-0 flex-1 space-y-2 text-neutral-500 xl:hidden">
          <p className="gothic-title text-[11px] font-medium normal-case tracking-normal text-neutral-300">
            El Cronista de las Sombras
          </p>
          <p className="tracking-[0.28em] text-neutral-500">PROTOCOLO_ACTIVO · SCHRECK_NET</p>
          <p className="truncate font-sans text-[12px] font-medium tracking-tight text-neutral-200">
            <span style={{ color: accent }}>{sheet.name?.trim() || "Sin nombre"}</span>
            <span className="text-neutral-600"> · </span>
            <span className="text-neutral-400">{clanLabelDisplay}</span>
          </p>
          <p className="tracking-tight">
            RUNTIME:PROYECTO_SERENO ·{" "}
            <span style={{ color: accent }} className="font-mono font-semibold">
              σ={inquisitionThreat}
            </span>
            {sheet.hunger >= 5 ? (
              <span className="ml-3 text-[var(--blood)]">[H_SAT:MAX]</span>
            ) : null}
          </p>
          <p className="text-neutral-600">
            [UI]={impulseMeta.impulseUnits}/2 · [CLOCK]={famineIntervalMinutes}min · [MJ]={isNarrator ? "1" : "0"}
            {manifestPenalty > 0 ? (
              <span className="ml-2 text-neutral-500"> · [LETARGO:−1 pool]</span>
            ) : null}
          </p>
        </div>
        <div
          className="hidden min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-neutral-500 xl:flex"
          aria-label="Estado de sesión"
        >
          <span className="gothic-title text-[10px] font-medium normal-case tracking-tight text-neutral-400">
            Canon activo
          </span>
          <span className="text-neutral-600">·</span>
          <span style={{ color: accent }} className="font-sans font-medium text-neutral-300">
            {STRAND_LABEL[activeStrand]}
          </span>
          {cronistaProcessing ? (
            <span className="animate-pulse text-[color:var(--neon)]">El Cronista escribe…</span>
          ) : null}
          {!isNarrator ? (
            <span className="text-neutral-600">
              Impulso {impulseMeta.impulseUnits}/2
              {manifestPenalty > 0 ? " · letargo (−1 reserva)" : ""}
            </span>
          ) : (
            <span className="text-neutral-600">
              MJ · reloj {famineIntervalMinutes} min · σ {inquisitionThreat}
            </span>
          )}
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-3 border-t border-[#222] pt-3 sm:gap-4 lg:w-auto lg:border-t-0 lg:pt-0">
          <TechnicalHud
            healthFilled={healthHudFilled}
            healthMax={HEALTH_MAX_UI}
            hunger={sheet.hunger}
            className="xl:hidden"
          />
          <div className="flex flex-wrap gap-2 sm:ml-auto lg:ml-0">
            <button
              type="button"
              onClick={() => navigateToPhase("sheetReview")}
              className="border border-neutral-600 px-3 py-2 text-[9px] uppercase tracking-widest text-neutral-400 hover:border-neutral-500 hover:text-neutral-300 xl:hidden"
            >
              HOJA
            </button>
            {(!sheetLocked || isNarrator) && (
              <button
                type="button"
                onClick={() => {
                  persistActiveProfile();
                  navigateToPhase("chargen");
                }}
                className="border border-[#252525] px-3 py-2 text-[9px] uppercase tracking-widest text-neutral-400 hover:border-[color:var(--accent-clan)] hover:text-neutral-300 xl:hidden"
              >
                {sheetLocked ? "CODEX_MJ" : "CODEX"}
              </button>
            )}
            <button
              type="button"
              onClick={goToProfileHub}
              className="border border-[#2a2a2a] px-3 py-2 text-[9px] uppercase tracking-widest text-neutral-500 hover:border-neutral-600 hover:text-neutral-400 xl:hidden"
            >
              REGISTRO CV
            </button>
            <button
              type="button"
              onClick={() => nuevaEscenaHiloActivo()}
              title="Reinicia solo el hilo activo (móvil / atajo)"
              className="border border-[color:var(--crimson)]/35 px-3 py-2 text-[9px] uppercase tracking-widest text-[color:var(--crimson)]/90 hover:bg-[color:var(--crimson)]/10"
            >
              NUEVA_ESCENA
            </button>
            {isNarrator ? (
              <button
                type="button"
                onClick={() => navigateToPhase("commandCenter")}
                className="hidden border border-[#7f1d1d]/50 px-3 py-2 text-[9px] uppercase tracking-widest text-[#fca5a5] hover:border-[#b91c1c]/70 sm:inline xl:hidden"
              >
                MANDO
              </button>
            ) : null}
            <button
              type="button"
              onClick={goToLogin}
              className="border border-[var(--blood)]/45 px-3 py-2 text-[9px] uppercase tracking-widest text-[var(--blood)] hover:bg-[var(--blood)]/10 xl:hidden"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col xl:flex-row xl:items-stretch">
        <SidebarMesa
          accent={accent}
          sheetName={sheet.name?.trim() ?? ""}
          clanLabel={clanLabelDisplay}
          healthFilled={healthHudFilled}
          healthMax={HEALTH_MAX_UI}
          hunger={sheet.hunger}
          onPersonajes={goToProfileHub}
          onNuevaEscena={nuevaEscenaHiloActivo}
          onHoja={() => navigateToPhase("sheetReview")}
          onCodex={() => {
            persistActiveProfile();
            navigateToPhase("chargen");
          }}
          codexButtonLabel={sheetLocked ? "CODEX_MJ" : "CODEX"}
          onLogout={goToLogin}
          isNarrator={isNarrator}
          onCentroMando={() => navigateToPhase("commandCenter")}
        />

        <CharacterStatusPanel
          sheet={sheet}
          xpLog={xpLog}
          sheetLocked={sheetLocked}
          isNarrator={isNarrator}
          onChange={(next, logLine) => handleSheetMutation(next, logLine)}
          footer={
            <NarrativeMemoryPanel
              ideasText={ideasRepo}
              onIdeasChange={handleIdeasChange}
              onResetChannel={handleNarrativeReset}
              activeStrand={activeStrand}
            />
          }
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden px-4 py-4 lg:gap-5 lg:px-6 lg:py-5">
          <NarrativeFlow
            logs={displayLogs}
            composer={composer}
            onComposer={setComposer}
            onSend={sendPlayer}
            accent={accent}
            processing={cronistaProcessing}
            showTechnicalAnchors={isNarrator}
            identityHint={identityHint}
            onPickSuggestion={(s) =>
              setComposer((c) => {
                const t = c.trim();
                return t ? `${t}\n${s}` : s;
              })
            }
            activeStrand={activeStrand}
            onStrandChange={commitStrand}
          />
          <ManifestWill
            key={`${sheet.hunger}-${sheet.name}-${impulseRev}`}
            sheet={sheet}
            hungerLevel={sheet.hunger}
            accent={accent}
            onManifest={handleManifestMotor}
            isProcessing={cronistaProcessing}
            poolPenalty={isNarrator ? 0 : manifestPenalty}
            impulseBlocked={impulseBlocked}
          />

          <details className="lg:hidden nexo-gothic-shell rounded-xl border border-[#2f2f36] px-4 py-3">
            <summary className="gothic-title cursor-pointer text-[10px] uppercase tracking-[0.25em] text-neutral-400">
              Crónica actual · vértice portátil
            </summary>
            <div className="mt-4 max-h-[50vh] overflow-y-auto border-t border-[#2a2a30] pt-4">
              <NexoChronicaRail {...chronicaRailProps} />
            </div>
          </details>
        </div>

        <aside className="hidden min-h-0 shrink-0 self-stretch border-l border-[#222] bg-black/35 lg:flex lg:w-[min(20vw,22rem)] lg:max-w-sm lg:flex-col lg:overflow-hidden xl:w-[min(18rem,26vw)]">
          <div className="border-b border-[#222] px-4 py-3 font-mono text-[8px] uppercase tracking-[0.3em] text-neutral-600">
            Riel diegético
          </div>
          <div className="min-h-0 flex-1 px-4 py-4">
            <NexoChronicaRail {...chronicaRailProps} />
          </div>
          <div className="flex min-h-[10rem] shrink-0 flex-col border-t border-[#222] lg:min-h-[12rem] lg:flex-1 lg:overflow-hidden">
            <ConclavePanel mates={MOCK_CONCLAVE} accent={accent} embedded />
          </div>
        </aside>
      </div>

      <AdminConsole
        open={adminOpen}
        onToggle={() => setAdminOpen((x) => !x)}
        isNarrator={isNarrator}
        onToggleNarrator={(v) => setIsNarrator(v)}
        inquisitionThreat={inquisitionThreat}
        onThreat={setInquisitionThreat}
        famineIntervalMinutes={famineIntervalMinutes}
        onFamineChange={persistFamine}
        forcedDifficulty={rollDifficulty}
        onForcedDifficulty={setRollDifficulty}
        command={mjCmd}
        onCommand={setMjCmd}
        onEmitCommand={emitMj}
        remoteSheetHint="//_PERSIST: local · TX→/api/narrador · MANIFESTAR→/api/cronista (Gemini)"
        onStressHunger={tweakRemoteSimulation}
        onForcedFrenesy={() => requestForcedRoll("frenesy", rollDifficulty)}
        onForcedRage={() => requestForcedRoll("enardecimiento", rollDifficulty)}
      />

    </div>
  );
}
