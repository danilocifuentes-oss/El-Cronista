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
  appendXpLog,
  loadMeta,
  loadXpLog,
  saveMeta,
} from "@/lib/sessionMeta";
import { CharacterCreation } from "./CharacterCreation";
import { CharacterStatusPanel } from "./CharacterStatusPanel";
import type { ConclaveMate } from "./ConclavePanel";
import { ConclavePanel } from "./ConclavePanel";
import { AdminConsole } from "./AdminConsole";
import type { LogEntry } from "./NarrativeFlow";
import { NarrativeFlow } from "./NarrativeFlow";
import { SchreckNetLogin } from "./SchreckNetLogin";
import { GameSessionProvider, useGameSession } from "@/context/GameSessionContext";
import { ManifestWill } from "./ManifestWill";
import { ForcedDestinyOverlay } from "./ForcedDestinyOverlay";
import { SerenoFooter } from "./SerenoFooter";
import { TechnicalHud } from "./TechnicalHud";
import { outcomeCode } from "@/lib/dice";

type Phase = "login" | "chargen" | "nexus";

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

function mergeStoredSheet(raw: CharacterSheet): CharacterSheet {
  return normalizeCharacterSheet(raw);
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
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "0",
      role: "sistema",
      text: "[BOOT]: Nexo_standby · buffer vacío.",
      ts: 0,
    },
  ]);
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
    setFamineIntervalMinutes,
    rollDifficulty,
    setRollDifficulty,
    forcedRoll,
    requestForcedRoll,
    clearForcedRoll,
  } = useGameSession();

  const accent = useMemo(() => CLAN_ACCENTS[sheet.clan], [sheet.clan]);

  const refreshXpLog = useCallback(() => setXpLog(loadXpLog()), []);

  const handleSheetMutation = useCallback(
    (next: CharacterSheet, logLine?: string) => {
      saveSheet(next);
      setSheet(next);
      const lockedNow = typeof window !== "undefined" ? loadMeta().sheetLocked : false;
      if (lockedNow && logLine) {
        appendXpLog(logLine);
        refreshXpLog();
      }
    },
    [refreshXpLog],
  );

  const applyLogin = () => {
    const stored = loadSheet();
    const meta = loadMeta();
    setSheetLocked(meta.sheetLocked);
    if (stored && stored.name) {
      setSheet(mergeStoredSheet(stored));
      setPhase("nexus");
      refreshXpLog();
      pushLog({ role: "sistema", text: "[CACHE_HIT]: índice operador · KV persistido." });
    } else {
      setPhase("chargen");
    }
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
      text: "[STATE_LOCK]: CODEX cerrado (`cronista-sheet-v1`) · mutaciones sólo MJ auditadas.",
    });
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

  function pushLog(part: Omit<LogEntry, "id" | "ts"> & { ts?: number }) {
    const entry: LogEntry = {
      id: uid(),
      ts: part.ts ?? Date.now(),
      role: part.role,
      text: part.text,
    };
    setLogs((prev) => [...prev, entry]);
  }

  const sendPlayer = async () => {
    const t = composer.trim();
    if (!t) return;
    setComposer("");
    pushLog({ role: "jugador", text: t });

    try {
      const whisper = await askCronista(t, `amenaza:${inquisitionThreat}`);
      pushLog({
        role: "narrador",
        text: whisper,
      });
    } catch {
      pushLog({ role: "sistema", text: "[PIPE_ERR]: downstream_narrative · timeout/mock." });
    }
  };

  const emitMj = () => {
    if (!mjCmd.trim() || !isNarrator) return;
    pushLog({ role: "sistema", text: `[MJ_PIPE]: ${mjCmd.trim()}` });
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
    setFamineIntervalMinutes(clamped);
    appendXpLog(`[CLOCK_CONFIG]:Δ=${clamped}m`);
    refreshXpLog();
  };

  const mainFrameClass =
    sheet.hunger >= 5 ? "flex min-h-screen flex-col crt-wrap ravenous-frame" : "flex min-h-screen flex-col crt-wrap";

  if (phase === "login") return <SchreckNetLogin onAuthenticate={applyLogin} />;

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

    return <CharacterCreation initial={mergeStoredSheet(stored ?? emptySheet())} onSave={(s) => finishChargen(s)} />;
  }

  const healthHudFilled =
    HEALTH_MAX_UI - Math.min(sheet.healthDamage, HEALTH_MAX_UI);

  return (
    <div
      className={`${mainFrameClass} techno-grid bg-[var(--void)] text-neutral-200`}
      style={{ ["--accent-clan"]: accent } as CSSProperties}
    >
      <TechnicalHud healthFilled={healthHudFilled} healthMax={HEALTH_MAX_UI} hunger={sheet.hunger} />

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

      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-[#161616] bg-black/55 px-4 py-4 pr-40 font-mono text-[10px] lg:px-6">
        <div className="space-y-2 text-neutral-500">
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
        <div className="flex flex-wrap gap-2">
          {(!sheetLocked || isNarrator) && (
            <button
              type="button"
              onClick={() => setPhase("chargen")}
              className="border border-[#252525] px-3 py-2 text-[9px] uppercase tracking-widest text-neutral-400 hover:border-[color:var(--accent-clan)] hover:text-neutral-300"
            >
              {sheetLocked ? "CODEX_MJ" : "CODEX"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setPhase("login")}
            className="border border-[var(--blood)]/45 px-3 py-2 text-[9px] uppercase tracking-widest text-[var(--blood)] hover:bg-[var(--blood)]/10"
          >
            LOGOUT
          </button>
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
                  text: `[EVENTO_MANIFEST]: cierre pipelines · DF blind · ${outcomeCode(playerLabel)}`,
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
        remoteSheetHint="//_PERSIST: sólo KV local (cronista-sheet / meta / audit). Backend TBD."
        onStressHunger={tweakRemoteSimulation}
        onForcedFrenesy={() => requestForcedRoll("frenesy", rollDifficulty)}
        onForcedRage={() => requestForcedRoll("enardecimiento", rollDifficulty)}
      />

      <SerenoFooter />
    </div>
  );
}
