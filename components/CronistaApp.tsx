"use client";

import { useMemo, useState } from "react";
import { CLAN_ACCENTS, emptySheet, loadSheet, saveSheet, type CharacterSheet } from "@/lib/character";
import { askCronista } from "@/lib/narrativeApi";
import { CharacterCreation } from "./CharacterCreation";
import { CharacterStatusPanel } from "./CharacterStatusPanel";
import type { ConclaveMate } from "./ConclavePanel";
import { ConclavePanel } from "./ConclavePanel";
import { DiceWidget } from "./DiceWidget";
import { AdminConsole } from "./AdminConsole";
import type { LogEntry } from "./NarrativeFlow";
import { NarrativeFlow } from "./NarrativeFlow";
import { SchreckNetLogin } from "./SchreckNetLogin";

type Phase = "login" | "chargen" | "nexus";

const MOCK_CONCLAVE: ConclaveMate[] = [
  { id: "1", name: "Mireya V.", clan: "Tremere", status: "refugio" },
  { id: "2", name: "_nullface", clan: "Nosferatu", status: "caceria" },
  { id: "3", name: "Elías K.", clan: "Brujah", status: "conclave" },
];

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function CronistaApp() {
  const [phase, setPhase] = useState<Phase>("login");
  const [sheet, setSheet] = useState<CharacterSheet>(() => emptySheet());
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "0",
      role: "narrador",
      text: "Las cámaras del siervo no proyectan tu rostro… sólo pulsos verdosenos contra el vértigo de la ciudad dormida.",
      ts: 0,
    },
  ]);
  const [composer, setComposer] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [inquisitionThreat, setInquisitionThreat] = useState(2);
  const [mjCmd, setMjCmd] = useState("");

  const accent = useMemo(() => CLAN_ACCENTS[sheet.clan], [sheet.clan]);

  const applyLogin = () => {
    const stored = loadSheet();
    if (stored && stored.name) {
      setSheet(stored);
      setPhase("nexus");
      pushLog({
        role: "sistema",
        text: "> Sesión recuperada desde almacén local. El Ojo reanuda vigilancia bilateral.",
      });
    } else {
      setPhase("chargen");
    }
  };

  const finishChargen = (w: CharacterSheet) => {
    saveSheet(w);
    setSheet(w);
    setPhase("nexus");
    pushLog({
      role: "sistema",
      text: "> Ficha cifrada en LocalStorage (`cronista-sheet-v1`). No hay pacto sabático sin papel.",
    });
  };

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
      pushLog({ role: "sistema", text: "// Error al contactar placeholder del Cronista IA." });
    }
  };

  const emitMj = () => {
    if (!mjCmd.trim()) return;
    pushLog({ role: "narrador", text: `[ORDEN MJ] ${mjCmd.trim()}` });
    setMjCmd("");
    setAdminOpen(false);
  };

  const tweakRemoteSimulation = () => {
    setSheet((s) => {
      const next = { ...s, hunger: Math.min(5, s.hunger + 1) };
      saveSheet(next);
      return next;
    });
    pushLog({
      role: "sistema",
      text: "[MJ] Sobrecarga simbólica: Hambre incrementada en el registro local (demo).",
    });
  };

  if (phase === "login") return <SchreckNetLogin onAuthenticate={applyLogin} />;

  if (phase === "chargen") {
    return (
      <CharacterCreation initial={loadSheet() ?? emptySheet()} onSave={(s) => finishChargen(s)} />
    );
  }

  return (
    <div className="flex min-h-screen flex-col crt-wrap">
      <header
        className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-neutral-800 bg-neutral-950/95 px-4 py-4 font-mono text-xs lg:px-8"
        style={{ boxShadow: "inset 0 -2px 0 rgba(57,255,20,0.08)" }}
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.5em] text-[var(--terminal)]">SchreckNet</p>
          <h1 className="font-sans text-lg font-semibold tracking-tight text-neutral-100">
            El Cronista de las Sombras
          </h1>
          <p className="max-w-xl text-neutral-500">
            Amenaza sabática del canal{" "}
            <span style={{ color: accent }} className="font-mono font-bold">
              σ = {inquisitionThreat}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPhase("chargen")}
            className="border border-neutral-700 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-neutral-400 sharp-border-inner hover:border-[var(--terminal)] hover:text-[var(--terminal)]"
          >
            Reabrir editor de ficha
          </button>
          <button
            type="button"
            onClick={() => setPhase("login")}
            className="border border-[var(--blood)]/50 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-[var(--blood)] sharp-border-inner hover:bg-[var(--blood)]/10"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-5rem)] flex-1 flex-col lg:flex-row">
        <CharacterStatusPanel
          sheet={sheet}
          onChange={(s) => {
            setSheet(s);
            saveSheet(s);
          }}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 lg:p-6">
          <NarrativeFlow
            logs={logs}
            composer={composer}
            onComposer={setComposer}
            onSend={sendPlayer}
            accent={accent}
          />
          <DiceWidget
            key={sheet.hunger}
            hungerLevel={sheet.hunger}
            onAnnounce={(m) => pushLog({ role: "sistema", text: m })}
          />
        </div>

        <ConclavePanel mates={MOCK_CONCLAVE} accent={accent} />
      </div>

      <AdminConsole
        open={adminOpen}
        onToggle={() => setAdminOpen((x) => !x)}
        inquisitionThreat={inquisitionThreat}
        onThreat={setInquisitionThreat}
        command={mjCmd}
        onCommand={setMjCmd}
        onEmitCommand={emitMj}
        remoteSheetHint="Las modificaciones remotas verdaderas vendrán con WebSockets + backend Camarilla Secure. Esta build escribe sólo tu LocalStorage."
        onApplyRemoteAdjust={tweakRemoteSimulation}
      />
    </div>
  );
}
