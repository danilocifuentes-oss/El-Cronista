"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { fetchCampaignTail, pushCampaignEntry } from "@/lib/campaignClient";
import {
  loadCampaignSyncSettings,
  saveCampaignSyncSettings,
  type CampaignSyncSettings,
} from "@/lib/campaignLocalSettings";
import { mergeCampaignIntoLog, recentLinesFromCampaign } from "@/lib/campaignMerge";
import { normalizeCampaignId, normalizePlayerTag } from "@/lib/campaignTypes";
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
  loadMjDirectives,
  loadNarrativeLog,
  loadRollingByStrand,
  loadRollingSummary,
  recentLinesForStrand,
  saveNarrativeLog,
  saveRollingSummary,
} from "@/lib/narrativeMemory";
import { buildCrossStrandContext, STRAND_LABEL, type NarrativeStrand } from "@/lib/narrativeStrands";
import { consumePendingSynapticDisruption, loadChronicle, peekPendingSynapticDisruption } from "@/lib/chronicleConfig";
import {
  appendXpLog,
  loadMeta,
  saveMeta,
} from "@/lib/sessionMeta";
import {
  completeImpulseSpend,
  letargoPoolPenalty,
  tickImpulseRefill,
  touchSignificantAction,
} from "@/lib/impulseUnits";
import { formatWorldNexusPromptBlock, ingestRollingSummary, loadNexusWorldState, saveNexusWorldState } from "@/lib/nexusWorldState";
import { applyMandatoryServerChronicleReset, factoryResetLocalNexoPreserveGenesis } from "@/lib/clientNexoReset";
import {
  fetchServerClientResetEpoch,
  readLocalClientResetEpoch,
  writeLocalClientResetEpoch,
} from "@/lib/nexoSessionSync";
import { formatNexoApiFailure } from "@/lib/nexoErrors";
import { sanitizePlayerFacingNarration, sanitizeSuggestionLine } from "@/lib/playerFacingText";
import { buildSheetSummaryLite } from "@/lib/sheetSummary";
import type { NarrativeLogEntry, NarradorRecentLine } from "@/lib/narrativeTypes";
import { CharacterCreation } from "./CharacterCreation";
import { CharacterStatusPanel } from "./CharacterStatusPanel";
import type { ConclaveMate } from "./ConclavePanel";
import { ConclavePanel } from "./ConclavePanel";
import { CampaignSyncBar } from "./CampaignSyncBar";
import { AdminConsole } from "./AdminConsole";
import { NarrativeFlow } from "./NarrativeFlow";
import { SidebarMesa } from "./SidebarMesa";
import { NexoChronicleDigest } from "./NexoChronicleDigest";
import { SchreckNetLogin } from "./SchreckNetLogin";
import { GameSessionProvider, useGameSession } from "@/context/GameSessionContext";
import { ManifestWill } from "./ManifestWill";
import { ForcedDestinyOverlay } from "./ForcedDestinyOverlay";
import { TechnicalHud } from "./TechnicalHud";
import { streamCronistaMotorWithFallback } from "@/lib/cronistaClient";
import { serializeV5Roll, type V5RollResult } from "@/lib/dice";
import {
  clearLocalPlayerProfilesOnly,
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
import { NexoComingSoon } from "./NexoComingSoon";
import { SoloCampaignApp } from "./SoloCampaignApp";
import type { Phase } from "@/lib/schreckPhase";
import {
  clearSchreckAuth,
  phaseToHref,
  queryParamToPhase,
  readAuthRole,
  writeAuthRole,
} from "@/lib/schreckNavigation";
import {
  clearOperatorSessionUnlock,
  isOperatorSessionUnlocked,
  setOperatorSessionUnlocked,
} from "@/lib/operatorSessionGate";
import {
  acquireNexoPrimeLock,
  buildArrivalNarradorPayload,
  nexoNeedsNarrativePriming,
  releaseNexoPrimeLock,
  stripBootPlaceholder,
  synthesizeInternalArrivalScene,
} from "@/lib/nexoArrivalPrime";

const HEALTH_MAX_UI = 7;

function orchestrationNpcKeyFromPlayerTag(tag: string): string | undefined {
  const slug = normalizePlayerTag(tag)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_.-]/g, "")
    .slice(0, 48);
  if (!slug) return undefined;
  const key = `pj:${slug}`.slice(0, 64);
  return /^[a-zA-Z0-9_:.\-]+$/.test(key) ? key : undefined;
}

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

/** Placeholder de arranque: el motor interno reemplazará esta entrada al entrar al Nexo si hace falta. */
const BOOT_STREAM: NarrativeLogEntry = {
  id: "0",
  role: "narrador",
  text: "La ciudad te recuerda igual de fría cuando el día la suelta al neón viejo y al ruido de metal húmedo. El siguiente movimiento será escena apenas cruces la primera sombra donde el mapa sí te reconoce.",
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
  commitStrand?: (s: NarrativeStrand) => void,
) {
  const stored = loadSheet();
  if (stored) setSheet(mergeStoredSheet(stored));
  setSheetLocked(loadMeta().sheetLocked);
  const nar = loadNarrativeLog();
  setLogs(nar.length > 0 ? nar : [BOOT_STREAM]);
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
  const [profileIndexTick, setProfileIndexTick] = useState(0);
  /** Re-render impulsos / letargo tras gastar o pasar el ciclo. */
  const [impulseRev, setImpulseRev] = useState(0);
  /** Multimesa: mismo `campaignId` + Upstash fusiona turnos en el hilo activo. */
  const [campaignSync, setCampaignSync] = useState<CampaignSyncSettings>(() => loadCampaignSyncSettings());
  const [remoteCampaignStore, setRemoteCampaignStore] = useState(false);
  const campaignSyncRef = useRef(campaignSync);
  campaignSyncRef.current = campaignSync;
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

  const hubProfiles = useMemo(() => {
    void profileIndexTick;
    return listProfiles();
  }, [profileIndexTick]);

  const displayLogs = useMemo(() => {
    const scoped = filterLogsByStrand(logs, activeStrand);
    if (isNarrator) return scoped;
    return scoped.filter((e) => !(e.role === "sistema" && /^\[\s*MJ_PIPE\s*\]:/i.test(e.text.trim())));
  }, [logs, activeStrand, isNarrator]);

  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  /** Detecta Upstash en servidor (GET devuelve storeDisabled: false). */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/campaign/entry?campaignId=nexo-ping-store&strand=principal&limit=1`, {
          cache: "no-store",
        });
        const j = (await res.json()) as { storeDisabled?: boolean };
        if (!cancelled && res.ok && j.storeDisabled === false) setRemoteCampaignStore(true);
      } catch {
        /* solo-local */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Mandato servidor: nueva crónica global (epoch) — limpia todo y recarga. */
  useEffect(() => {
    let cancelled = false;
    async function checkClientResetEpoch() {
      try {
        const server = await fetchServerClientResetEpoch();
        if (cancelled) return;
        const local = readLocalClientResetEpoch();
        if (server > local) {
          applyMandatoryServerChronicleReset();
          writeLocalClientResetEpoch(server);
          window.location.reload();
        }
      } catch {
        /* red caída: reintentar en el próximo intervalo */
      }
    }
    void checkClientResetEpoch();
    const id = window.setInterval(checkClientResetEpoch, 45_000);
    const onVis = () => {
      if (document.visibilityState === "visible") void checkClientResetEpoch();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  /** Fusiona turnos remotos en el buffer local (mismo id-sala + hilo). */
  useEffect(() => {
    if (!campaignSync.enabled) return;
    const cid = normalizeCampaignId(campaignSync.campaignId);
    if (!cid) return;

    const run = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      const { entries } = await fetchCampaignTail(cid, activeStrand, 48);
      if (!entries.length) return;
      setLogs((prev) => {
        const merged = mergeCampaignIntoLog(prev, entries);
        if (merged.length === prev.length) return prev;
        saveNarrativeLog(merged);
        queueMicrotask(() => {
          const aid = getActiveProfileId();
          if (aid) syncActiveBundleFromGlobals(aid);
        });
        return merged;
      });
    };

    void run();
    const id = window.setInterval(() => void run(), 32000);
    return () => window.clearInterval(id);
  }, [campaignSync.enabled, campaignSync.campaignId, activeStrand]);

  /** Apertura Nexo principal: narración siempre primero (motor interno, sin API). */
  useEffect(() => {
    if (phase !== "nexus") return;
    if (!sheetLocked) return;
    if (activeStrand !== "principal") return;
    if (!acquireNexoPrimeLock()) return;

    void (async () => {
      try {
        let merged = loadNarrativeLog();
        const cmp = campaignSyncRef.current;
        const cid = normalizeCampaignId(cmp.campaignId);
        if (cmp.enabled && cid && remoteCampaignStore) {
          try {
            const { entries } = await fetchCampaignTail(cid, "principal", 40);
            const next = mergeCampaignIntoLog(merged.length ? merged : logs, entries);
            if (next.length > 0 && (next.length !== merged.length || entries.length > 0)) {
              merged = next;
              saveNarrativeLog(merged);
              setLogs(merged);
            }
          } catch {
            /* cola remota opcional */
          }
        }

        const candidate = merged.length > 0 ? merged : logs;
        if (!nexoNeedsNarrativePriming(candidate, "principal")) return;

        const chron = loadChronicle();
        const world = loadNexusWorldState();
        const worldBlock = formatWorldNexusPromptBlock(world, "principal");
        const body = buildArrivalNarradorPayload({
          sheet,
          chronicle: chron,
          strand: "principal",
          inquisitionThreat,
          worldState: world,
          worldNexusPrompt: worldBlock,
          rollingSummary: loadRollingSummary()?.trim() || undefined,
          activeProfileId: getActiveProfileId(),
        });
        const out = synthesizeInternalArrivalScene(body);
        const narrId = uid();
        const summary = out.resumen_actualizado?.trim();

        setLogs((prev) => {
          const stripped = stripBootPlaceholder(prev);
          const next: NarrativeLogEntry[] = [
            ...stripped,
            {
              id: narrId,
              role: "narrador",
              strand: "principal",
              ts: Date.now(),
              text: sanitizePlayerFacingNarration(out.narracion.trim()),
              ...(Array.isArray(out.suggestions) && out.suggestions.length
                ? { suggestions: out.suggestions.slice(0, 8).map(sanitizeSuggestionLine) }
                : {}),
            },
          ];
          saveNarrativeLog(next);
          queueMicrotask(() => {
            const aid = getActiveProfileId();
            if (aid) syncActiveBundleFromGlobals(aid);
          });
          return next;
        });

        if (summary) {
          saveRollingSummary(summary);
          saveNexusWorldState(ingestRollingSummary(world, summary));
        }
        setImpulseRev((x) => x + 1);
      } finally {
        releaseNexoPrimeLock();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- arranque tras hidratar/cambiar log principal
  }, [phase, sheetLocked, activeStrand, sheet, inquisitionThreat, logs, remoteCampaignStore]);

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

    if (target === "commandCenter" && !isOperatorSessionUnlocked()) {
      target = "profileHub";
      if (narrator) {
        try {
          window.history.replaceState({ phase: "profileHub" }, "", phaseToHref("profileHub"));
        } catch {
          /* */
        }
      }
    }
    if (target === "commandCenter" && !narrator) target = "profileHub";
    if ((target === "nexus" || target === "soloCampaign") && !narrator && !getActiveProfileId()) target = "profileHub";

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

      if (target === "commandCenter" && (!narrator || !isOperatorSessionUnlocked())) {
        window.history.replaceState({ phase: "profileHub" }, "", phaseToHref("profileHub"));
        target = "profileHub";
      } else if ((target === "nexus" || target === "soloCampaign") && !narrator && !getActiveProfileId()) {
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
      }
      const aid = getActiveProfileId();
      if (aid) syncActiveBundleFromGlobals(aid);
    },
    [],
  );

  const applyLogin = () => {
    migrateLegacyToProfiles();
    writeAuthRole("player");
    setIsNarrator(false);
    clearOperatorSessionUnlock();
    navigateToPhase("profileHub");
  };

  const applyRootAccess = () => {
    migrateLegacyToProfiles();
    writeAuthRole("narrator");
    setIsNarrator(true);
    setOperatorSessionUnlocked();
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
    navigateToPhase("soloCampaign");
    pushLog({
      role: "sistema",
      text: "Tu CODEX quedó cerrado para Campaña Solitaria.",
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
    }, 45000);

    return () => window.clearInterval(id);
  }, []);

  function pushLog(part: Omit<NarrativeLogEntry, "id" | "ts"> & { ts?: number; id?: string }) {
    const strand = part.strand ?? activeStrandRef.current;
    const entry: NarrativeLogEntry = {
      id: part.id?.trim() ? part.id.trim() : uid(),
      ts: part.ts ?? Date.now(),
      role: part.role,
      text: part.text,
      strand,
      ...(part.cronistaOut ? { cronistaOut: true } : {}),
      ...(Array.isArray(part.suggestions) && part.suggestions.length
        ? { suggestions: part.suggestions.slice(0, 8) }
        : {}),
      ...(part.rollPrompt ? { rollPrompt: part.rollPrompt } : {}),
      ...(part.sigmaGlitch ? { sigmaGlitch: true } : {}),
      ...(part.beastTone ? { beastTone: true } : {}),
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

  const genesisSnap = useMemo(() => loadChronicle(), [logs.length, profileIndexTick]);
  const rollingSnap = useMemo(() => loadRollingSummary(), [logs, activeStrand, impulseRev]);
  const pendingSynapticPreview = peekPendingSynapticDisruption()?.trim() ?? "";

  const chronicleAsideProps = {
    chronicle: genesisSnap,
    activeStrand,
    inquisitionThreat,
    rollingSummary: rollingSnap,
    pendingSynaptic: pendingSynapticPreview,
  } as const;

  useEffect(() => {
    if (phase !== "commandCenter") return;
    if (isOperatorSessionUnlocked()) return;
    navigateToPhase("profileHub", { replace: true });
  }, [phase, navigateToPhase]);

  const sendPlayer = async () => {
    const t = composer.trim();
    if (!t) return;
    setComposer("");
    const playerMsgId = uid();
    pushLog({ id: playerMsgId, role: "jugador", text: t });

    const strand = activeStrandRef.current;
    const prior = recentLinesForStrand(logs, strand, 4);
    const cmp = campaignSync;
    const cid = normalizeCampaignId(cmp.campaignId);
    const tag = normalizePlayerTag(cmp.playerTag || sheet.name?.trim() || "PJ") || "PJ";
    const orchestrationNpcKey = orchestrationNpcKeyFromPlayerTag(tag);

    let recentLogs: NarradorRecentLine[];
    if (cmp.enabled && cid && remoteCampaignStore) {
      await pushCampaignEntry({
        campaignId: cid,
        playerTag: tag,
        strand,
        role: "jugador",
        text: t,
        id: playerMsgId,
        ts: Date.now(),
      });
      const { entries } = await fetchCampaignTail(cid, strand, 32);
      const fromCamp = recentLinesFromCampaign(entries, strand, 6);
      recentLogs = fromCamp.length ? fromCamp : [...prior, { role: "jugador" as const, text: t }].slice(-5);
    } else {
      recentLogs = [...prior, { role: "jugador" as const, text: t }].slice(-5);
    }

    const cross = buildCrossStrandContext(strand, loadRollingByStrand());
    const worldNexusContext = formatWorldNexusPromptBlock(loadNexusWorldState(), strand);

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
        ideasRepository: undefined,
        narrativeStrand: strand,
        crossStrandContext: cross.trim() || undefined,
        worldNexusContext,
        ...(orchestrationNpcKey ? { orchestrationNpcKey } : {}),
      });
      const narrId = uid();
      pushLog({
        id: narrId,
        role: "narrador",
        text: out.narration,
        ...(out.suggestions?.length ? { suggestions: out.suggestions } : {}),
        ...(out.rollPrompt ? { rollPrompt: out.rollPrompt } : {}),
        ...(sheet.hunger > 3 ? { beastTone: true } : {}),
      });
      if (out.nexoInternalV1?.systemWhispers?.length) {
        for (const w of out.nexoInternalV1.systemWhispers) {
          pushLog({ role: "sistema", text: w, sigmaGlitch: true });
        }
      }
      if (cmp.enabled && cid && remoteCampaignStore) {
        void pushCampaignEntry({
          campaignId: cid,
          playerTag: tag,
          strand,
          role: "narrador",
          text: out.narration.slice(0, 4500),
          id: narrId,
          ts: Date.now(),
        });
      }
      if (out.rollingSummary) saveRollingSummary(out.rollingSummary);
      saveNexusWorldState(ingestRollingSummary(loadNexusWorldState(), out.rollingSummary));
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
    pushLog({ role: "sistema", text: `//_MJ · ${cmd}` });
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
            text: "Todavía no sentís el impulso que exige manifestar voluntad frente a esta ciudad — esperá el ciclo o movete más en el canal antes de volver a tirar.",
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
      const worldNexusContext = formatWorldNexusPromptBlock(loadNexusWorldState(), strand);

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
            ideasRepository: undefined,
            narrativeStrand: strand,
            crossStrandContext: cross.trim() || undefined,
            worldNexusContext,
          },
          (delta) => {
            acc += delta;
            setLogs((prev) => prev.map((e) => (e.id === streamId ? { ...e, text: acc } : e)));
          },
        );
        const finalText =
          sanitizePlayerFacingNarration(acc.trim()) ||
          "El silencio pesa igual que evidencia vieja pegada en la suela hasta que decidís pisar más fuerte de nuevo.";
        setLogs((prev) => {
          const next = prev.map((e) => (e.id === streamId ? { ...e, text: finalText } : e));
          saveNarrativeLog(next);
          queueMicrotask(() => {
            const aid = getActiveProfileId();
            if (aid) syncActiveBundleFromGlobals(aid);
          });
          return next;
        });
        const cmp = campaignSyncRef.current;
        const cid = normalizeCampaignId(cmp.campaignId);
        const tag = normalizePlayerTag(cmp.playerTag || sheet.name?.trim() || "PJ") || "PJ";
        if (remoteCampaignStore && cmp.enabled && cid) {
          void pushCampaignEntry({
            campaignId: cid,
            playerTag: tag,
            strand,
            role: "narrador",
            text: finalText.slice(0, 4500),
            id: streamId,
            ts: Date.now(),
          });
        }
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
    [sheet, isNarrator, remoteCampaignStore],
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
  };

  const ravenousVisual = sheet.hunger >= 5 || beastPulse;
  const hungerVeil = sheet.hunger >= 4 && sheet.hunger < 5 && !beastPulse;
  const mainFrameClass = [
    "flex min-h-screen flex-col bg-black crt-wrap",
    hungerVeil ? "hunger-veil" : "",
    ravenousVisual ? "ravenous-frame" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const impulseMeta = useMemo(() => {
    void impulseRev;
    return tickImpulseRefill(loadMeta());
  }, [impulseRev, phase]);

  const manifestPenalty = letargoPoolPenalty(impulseMeta);
  const impulseBlocked = !isNarrator && impulseMeta.impulseUnits <= 0;

  const goToLogin = () => {
    persistActiveProfile();
    clearSchreckAuth();
    clearOperatorSessionUnlock();
    setIsNarrator(false);
    navigateToPhase("login", { replace: true });
  };

  const goToProfileHub = () => {
    persistActiveProfile();
    navigateToPhase("profileHub");
  };

  const enterProfile = (id: string) => {
    if (!selectProfile(id)) return;
    applyGlobalsToUi(setSheet, setSheetLocked, setLogs, commitStrand);
    navigateToPhase("nexus");
    appendXpLog(`Sesión cargada · ${loadSheet()?.name?.trim() || id}`);
  };

  const enterSoloProfile = (id: string) => {
    if (!selectProfile(id)) return;
    applyGlobalsToUi(setSheet, setSheetLocked, setLogs, commitStrand);
    navigateToPhase("soloCampaign");
    appendXpLog(`Campaña solitaria · ${loadSheet()?.name?.trim() || id}`);
  };

  const startBlankSheet = () => {
    createBlankProfile();
    applyGlobalsToUi(setSheet, setSheetLocked, setLogs, commitStrand);
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
        onFactoryReset={() => {
          factoryResetLocalNexoPreserveGenesis();
          applyGlobalsToUi(setSheet, setSheetLocked, setLogs, commitStrand);
          setProfileIndexTick((n) => n + 1);
          setComposer("");
          setInquisitionThreat(2);
          navigateToPhase("profileHub");
        }}
        onGoHub={() => navigateToPhase("profileHub")}
      onGoNexus={() => {
          const id = getActiveProfileId();
          if (!id) {
            window.alert("No hay perfil activo. Abre REGISTRO_CV y selecciona un CV.");
            return;
          }
          if (!selectProfile(id)) return;
          applyGlobalsToUi(setSheet, setSheetLocked, setLogs, commitStrand);
          navigateToPhase("soloCampaign");
        }}
        onRefreshGlobals={() =>
          applyGlobalsToUi(setSheet, setSheetLocked, setLogs, commitStrand)
        }
      />
    );
  }

  if (phase === "profileHub") {
    return (
      <ProfileHub
        profiles={hubProfiles}
        onPlayProfile={(id) => enterProfile(id)}
        onPlaySoloProfile={(id) => enterSoloProfile(id)}
        onNewSheetBlank={startBlankSheet}
        onLogout={goToLogin}
        onClearLocalProfiles={() => {
          clearLocalPlayerProfilesOnly();
          applyGlobalsToUi(setSheet, setSheetLocked, setLogs, commitStrand);
          setProfileIndexTick((n) => n + 1);
        }}
      />
    );
  }

  if (phase === "soloCampaign") {
    const activeId = getActiveProfileId();
    if (!activeId) {
      navigateToPhase("profileHub", { replace: true });
      return null;
    }
    return <SoloCampaignApp profileId={activeId} sheet={sheet} onExit={goToProfileHub} />;
  }

  if (phase === "chargen") {
    const meta = loadMeta();
    const stored = loadSheet();
    const mechanicalLocked = Boolean(meta.sheetLocked && !isNarrator && stored?.name?.trim());

    const initialForChargen: CharacterSheet =
      meta.sheetLocked && isNarrator && stored
        ? mergeStoredSheet(stored)
        : stored && stored.name?.trim()
          ? mergeStoredSheet(stored)
          : emptySheet();

    function persistCodexNarrative(s: CharacterSheet) {
      const next = normalizeCharacterSheet(s);
      saveSheet(next);
      setSheet(next);
      persistActiveProfile();
      navigateToPhase("soloCampaign");
      appendXpLog(`Identidad marcada · ${next.name?.trim() || "—"}`);
    }

    return (
      <div className="min-h-screen bg-[#050505]">
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 font-sans text-[10px] text-neutral-500">
          <span className="tracking-[0.28em] text-neutral-400">Codex V</span>
          <button
            type="button"
            onClick={() => navigateToPhase("soloCampaign", { replace: true })}
            className="rounded border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[0.16em] text-neutral-400 transition hover:border-neutral-600 hover:text-neutral-200"
          >
            Volver a Campaña
          </button>
        </header>
        <CharacterCreation
          initial={initialForChargen}
          mechanicalLocked={mechanicalLocked}
          onSave={(s) => {
            if (mechanicalLocked) {
              persistCodexNarrative(s);
              return;
            }
            finishChargen(s);
          }}
        />
      </div>
    );
  }

  if (phase === "nexus") {
    return <NexoComingSoon onGoSolo={() => navigateToPhase("soloCampaign")} onGoHub={goToProfileHub} />;
  }

  const healthHudFilled = HEALTH_MAX_UI - Math.min(sheet.healthDamage, HEALTH_MAX_UI);

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
          pushLog({ role: "sistema", text: line });
          clearForcedRoll();
        }}
      />

      <header className="flex shrink-0 flex-col gap-3 border-b border-[#1a1a1e] bg-[#050506] px-4 py-4 font-sans text-[10px] text-neutral-500 sm:gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-6">
        <div className="min-w-0 flex-1 space-y-1.5 xl:hidden">
          <p className="text-[11px] font-light tracking-[0.32em] text-neutral-300">Codex V · ciudad</p>
          <p className="truncate text-[13px] font-medium tracking-tight text-neutral-100">
            <span style={{ color: accent }}>{sheet.name?.trim() || "Sin nombre"}</span>
            <span className="text-neutral-600"> · </span>
            <span className="text-neutral-400">{clanLabelDisplay}</span>
          </p>
          {!isNarrator ? (
            <p className="text-[9px] tracking-wide text-neutral-600">
              Impulso {impulseMeta.impulseUnits}/2
              {manifestPenalty > 0 ? " · Letargo (−1 en reservas de manifestar)" : ""}
            </p>
          ) : null}
        </div>
        <div
          className="hidden min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-neutral-600 xl:flex"
          aria-label="Estado de sesión"
        >
          <span className="tracking-[0.2em] text-neutral-500">Codex V</span>
          <span className="text-neutral-700">·</span>
          <span style={{ color: accent }} className="font-medium text-neutral-300">
            {STRAND_LABEL[activeStrand]}
          </span>
          {cronistaProcessing ? <span className="animate-pulse text-[color:var(--neon)]">La voz del canal…</span> : null}
          <span className="text-neutral-600">
            σ {inquisitionThreat}
            {!isNarrator ? ` · impulso ${impulseMeta.impulseUnits}/2` : ` · Reloj ${famineIntervalMinutes}m`}
          </span>
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-3 border-t border-white/[0.04] pt-3 sm:gap-4 lg:w-auto lg:border-t-0 lg:pt-0">
          <TechnicalHud
            healthFilled={healthHudFilled}
            healthMax={HEALTH_MAX_UI}
            hunger={sheet.hunger}
            compactLabels
            className="xl:hidden"
          />
          <div className="flex flex-wrap gap-2 sm:ml-auto lg:ml-0">
            <button
              type="button"
              onClick={() => {
                persistActiveProfile();
                navigateToPhase("chargen");
              }}
              className="border border-white/10 bg-black/40 px-3 py-2 text-[9px] uppercase tracking-[0.14em] text-neutral-300 hover:border-[color:var(--accent-clan)]/40 xl:hidden"
            >
              Hoja CODEX
            </button>
            <button
              type="button"
              onClick={goToProfileHub}
              className="border border-white/[0.06] px-3 py-2 text-[9px] uppercase tracking-[0.12em] text-neutral-500 hover:border-neutral-700 hover:text-neutral-300 xl:hidden"
            >
              Cripta del Elíseo
            </button>
            <button
              type="button"
              onClick={goToLogin}
              className="border border-[var(--blood)]/35 px-3 py-2 text-[9px] uppercase tracking-[0.16em] text-[var(--blood)] hover:bg-[var(--blood)]/10 xl:hidden"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {isNarrator ? (
        <CampaignSyncBar
          value={campaignSync}
          onChange={(next) => {
            saveCampaignSyncSettings(next);
            setCampaignSync(next);
          }}
          remoteStoreReady={remoteCampaignStore}
        />
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col xl:flex-row xl:items-stretch">
        <SidebarMesa
          accent={accent}
          sheet={sheet}
          citySigma={inquisitionThreat}
          healthFilled={healthHudFilled}
          healthMax={HEALTH_MAX_UI}
          hunger={sheet.hunger}
          onEidolonVault={goToProfileHub}
          onCodex={() => {
            persistActiveProfile();
            navigateToPhase("chargen");
          }}
          onLogout={goToLogin}
        />

        <CharacterStatusPanel sheet={sheet} isNarrator={isNarrator} />

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
            glyphContext={{ inquisitionThreat, hunger: sheet.hunger }}
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

          <details className="lg:hidden rounded-xl border border-white/[0.06] bg-black/35 px-4 py-3">
            <summary className="cursor-pointer text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              Eco del mundo
            </summary>
            <div className="mt-3 max-h-[48vh] overflow-y-auto rounded-lg border border-white/[0.04]">
              <NexoChronicleDigest {...chronicleAsideProps} />
            </div>
          </details>
        </div>

        <aside className="hidden min-h-0 shrink-0 self-stretch border-l border-white/[0.06] bg-[linear-gradient(180deg,#060607,#0a0a0d)] lg:flex lg:w-[min(20vw,22rem)] lg:max-w-sm lg:flex-col lg:overflow-hidden xl:w-[min(17rem,24vw)]">
          <div className="border-b border-white/[0.05] px-5 py-4 font-sans text-[10px] font-light uppercase tracking-[0.35em] text-neutral-500">
            Continuidad
          </div>
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            <NexoChronicleDigest {...chronicleAsideProps} />
          </div>
          <div className="flex min-h-[9rem] shrink-0 flex-col border-t border-white/[0.05] lg:min-h-0 lg:max-h-[38%] lg:overflow-hidden">
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
        onStressHunger={tweakRemoteSimulation}
        onForcedFrenesy={() => requestForcedRoll("frenesy", rollDifficulty)}
        onForcedRage={() => requestForcedRoll("enardecimiento", rollDifficulty)}
      />

    </div>
  );
}
