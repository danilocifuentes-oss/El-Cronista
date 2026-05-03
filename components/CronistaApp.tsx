"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  CLAN_ACCENTS,
  emptySheet,
  loadSheet,
  normalizeCharacterSheet,
  saveSheet,
  type CharacterSheet,
} from "@/lib/character";
import { askCronista } from "@/lib/narrativeApi";
import {
  appendMjDirective,
  loadMjDirectives,
  loadNarrativeLog,
  loadRollingSummary,
  saveNarrativeLog,
  saveRollingSummary,
} from "@/lib/narrativeMemory";
import {
  appendXpLog,
  loadMeta,
  loadXpLog,
  saveMeta,
} from "@/lib/sessionMeta";
import { buildSheetSummary } from "@/lib/sheetSummary";
import type { NarrativeLogEntry } from "@/lib/narrativeTypes";
import { CharacterCreation } from "./CharacterCreation";
import { CharacterStatusPanel } from "./CharacterStatusPanel";
import type { ConclaveMate } from "./ConclavePanel";
import { ConclavePanel } from "./ConclavePanel";
import { AdminConsole } from "./AdminConsole";
import { NarrativeFlow } from "./NarrativeFlow";
import { SchreckNetLogin } from "./SchreckNetLogin";
import { GameSessionProvider, useGameSession } from "@/context/GameSessionContext";
import { ManifestWill } from "./ManifestWill";
import { ForcedDestinyOverlay } from "./ForcedDestinyOverlay";
import { SerenoFooter } from "./SerenoFooter";
import { TechnicalHud } from "./TechnicalHud";
import { outcomeCode } from "@/lib/dice";
import {
  createBlankProfile,
  getActiveProfileId,
  listProfiles,
  migrateLegacyToProfiles,
  selectProfile,
  syncActiveBundleFromGlobals,
} from "@/lib/profileStore";
import { ProfileHub } from "./ProfileHub";

type Phase = "login" | "profileHub" | "chargen" | "nexus" | "sheetReview";

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
) {
  const stored = loadSheet();
  if (stored) setSheet(mergeStoredSheet(stored));
  setSheetLocked(loadMeta().sheetLocked);
  const nar = loadNarrativeLog();
  setLogs(nar.length > 0 ? nar : [BOOT_STREAM]);
  refreshXpLog();
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
  const [composer, setComposer] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [inquisitionThreat, setInquisitionThreat] = useState(2);
  const [mjCmd, setMjCmd] = useState("");
  const [xpLog, setXpLog] = useState(() =>
    typeof window === "undefined" ? [] : loadXpLog(),
  );

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

  const refreshXpLog = useCallback(() => setXpLog(loadXpLog()), []);

  useEffect(() => {
    const saved = loadNarrativeLog();
    if (saved.length === 0) return;
    queueMicrotask(() => {
      setLogs(saved);
    });
  }, []);

  useEffect(() => {
    if (phase !== "nexus") return;
    const m = loadMeta();
    setFamineIntervalMinutesCtx(
      typeof m.famineIntervalMinutes === "number"
        ? Math.max(5, Math.min(240, m.famineIntervalMinutes))
        : 60,
    );
  }, [phase, setFamineIntervalMinutesCtx]);

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
    setPhase("profileHub");
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
    setPhase("nexus");
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
    const entry: NarrativeLogEntry = {
      id: uid(),
      ts: part.ts ?? Date.now(),
      role: part.role,
      text: part.text,
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

  const sendPlayer = async () => {
    const t = composer.trim();
    if (!t) return;
    setComposer("");
    pushLog({ role: "jugador", text: t });

    const prior = logs.slice(-28).map(({ role, text }) => ({ role, text }));
    const recentLogs = [...prior, { role: "jugador" as const, text: t }];

    try {
      const out = await askCronista({
        playerAction: t,
        recentLogs,
        sheetSummary: buildSheetSummary(sheet),
        inquisitionThreat,
        mjDirectives: loadMjDirectives(),
        rollingSummary: loadRollingSummary() || undefined,
      });
      pushLog({ role: "narrador", text: out.narration });
      if (out.rollingSummary) saveRollingSummary(out.rollingSummary);
    } catch (e) {
      pushLog({
        role: "sistema",
        text: `[PIPE_ERR]: ${e instanceof Error ? e.message : String(e)}`,
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

  const mainFrameClass =
    sheet.hunger >= 5 ? "flex min-h-screen flex-col crt-wrap ravenous-frame" : "flex min-h-screen flex-col crt-wrap";

  const goToLogin = () => {
    persistActiveProfile();
    setPhase("login");
  };

  const goToProfileHub = () => {
    persistActiveProfile();
    setPhase("profileHub");
  };

  const enterProfile = (id: string) => {
    if (!selectProfile(id)) return;
    applyGlobalsToUi(setSheet, setSheetLocked, setLogs, refreshXpLog);
    setPhase("nexus");
    pushLog({ role: "sistema", text: `[PERFIL]: ${loadSheet()?.name || id}` });
  };

  const startBlankSheet = () => {
    createBlankProfile();
    applyGlobalsToUi(setSheet, setSheetLocked, setLogs, refreshXpLog);
    setPhase("chargen");
  };

  if (phase === "login") return <SchreckNetLogin onAuthenticate={applyLogin} />;

  if (phase === "profileHub") {
    return (
      <ProfileHub
        profiles={listProfiles()}
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
              setPhase("nexus");
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
      <div className="flex min-h-screen flex-col bg-[var(--void)] techno-grid">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#161616] bg-black/70 px-4 py-3 font-mono text-[10px] text-neutral-400">
          <p className="tracking-[0.25em] text-[var(--terminal)]/90">{"//_HOJA · SOLO_LECTURA"}</p>
          <button
            type="button"
            onClick={() => setPhase("nexus")}
            className="border border-[var(--terminal)]/35 px-4 py-2 text-[9px] uppercase tracking-widest text-[var(--terminal)] hover:bg-[var(--terminal)]/10"
          >
            Volver al Nexo
          </button>
        </header>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col p-4 pb-10 lg:max-w-lg">
          <CharacterStatusPanel
            sheet={sheet}
            onChange={() => {}}
            xpLog={xpLog}
            sheetLocked={sheetLocked}
            isNarrator={isNarrator}
            readOnlyMode
          />
        </div>
        <SerenoFooter />
      </div>
    );
  }

  return (
    <div
      className={`${mainFrameClass} techno-grid bg-[var(--void)] text-neutral-200`}
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

      <header className="flex shrink-0 flex-col gap-3 border-b border-[#161616] bg-black/55 px-4 py-4 font-mono text-[10px] sm:gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-6">
        <div className="min-w-0 flex-1 space-y-2 text-neutral-500">
          <p className="text-[var(--terminal)]/90 tracking-[0.25em]">CANAL SCHRECK_NET · NEXO_LATAM</p>
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
            [CLOCK]={famineIntervalMinutes}min · [MJ]={isNarrator ? "1" : "0"}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-3 border-t border-[#161616]/60 pt-3 sm:gap-4 lg:w-auto lg:border-t-0 lg:pt-0">
          <TechnicalHud healthFilled={healthHudFilled} healthMax={HEALTH_MAX_UI} hunger={sheet.hunger} />
          <div className="flex flex-wrap gap-2 sm:ml-auto lg:ml-0">
            <button
              type="button"
              onClick={() => setPhase("sheetReview")}
              className="border border-neutral-600 px-3 py-2 text-[9px] uppercase tracking-widest text-neutral-400 hover:border-neutral-500 hover:text-neutral-300"
            >
              HOJA
            </button>
            {(!sheetLocked || isNarrator) && (
              <button
                type="button"
                onClick={() => {
                  persistActiveProfile();
                  setPhase("chargen");
                }}
                className="border border-[#252525] px-3 py-2 text-[9px] uppercase tracking-widest text-neutral-400 hover:border-[color:var(--accent-clan)] hover:text-neutral-300"
              >
                {sheetLocked ? "CODEX_MJ" : "CODEX"}
              </button>
            )}
            <button
              type="button"
              onClick={goToProfileHub}
              className="border border-[#2a2a2a] px-3 py-2 text-[9px] uppercase tracking-widest text-neutral-500 hover:border-neutral-600 hover:text-neutral-400"
            >
              PERFILES
            </button>
            <button
              type="button"
              onClick={goToLogin}
              className="border border-[var(--blood)]/45 px-3 py-2 text-[9px] uppercase tracking-widest text-[var(--blood)] hover:bg-[var(--blood)]/10"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-5rem)] flex-1 flex-col lg:flex-row">
        <CharacterStatusPanel
          sheet={sheet}
          xpLog={xpLog}
          sheetLocked={sheetLocked}
          isNarrator={isNarrator}
          onChange={(next, logLine) => handleSheetMutation(next, logLine)}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 p-4 lg:p-6">
          <NarrativeFlow
            logs={logs}
            composer={composer}
            onComposer={setComposer}
            onSend={sendPlayer}
            accent={accent}
          />
          <ManifestWill
            key={`${sheet.hunger}-${sheet.name}`}
            sheet={sheet}
            hungerLevel={sheet.hunger}
            accent={accent}
            onResolve={(narratorLine, playerLabel) => {
              if (isNarrator) {
                pushLog({ role: "sistema", text: narratorLine });
              } else {
                pushLog({
                  role: "sistema",
                  text: `[EVENTO_MANIFEST]: canal narrativo cerrado · dificultad oculta · ${outcomeCode(playerLabel)}`,
                });
              }
            }}
          />
        </div>

        <ConclavePanel mates={MOCK_CONCLAVE} accent={accent} />
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
        remoteSheetHint="//_PERSIST: hoja y bitácora en localStorage. Narrador: POST /api/narrador (Gemini) — clave en .env.local"
        onStressHunger={tweakRemoteSimulation}
        onForcedFrenesy={() => requestForcedRoll("frenesy", rollDifficulty)}
        onForcedRage={() => requestForcedRoll("enardecimiento", rollDifficulty)}
      />

      <SerenoFooter />
    </div>
  );
}
