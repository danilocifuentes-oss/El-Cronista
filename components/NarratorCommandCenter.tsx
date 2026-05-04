"use client";

import { useEffect, useMemo, useState } from "react";
import { createProfileEntity } from "@/lib/profileStore";
import type { ProfileSummary } from "@/lib/profileStore";
import type { ChronicleConfig } from "@/lib/chronicleConfig";
import { loadChronicle, saveChronicle, setPendingSynapticDisruption } from "@/lib/chronicleConfig";
import {
  compileGenesisManuscript,
  GENESIS_MANUSCRIPT_EXAMPLE,
  GENESIS_MANUSCRIPT_REFERENCE,
} from "@/lib/genesisManuscript";
import { wipeLocalNexoTranscript, wipeLocalRollingState } from "@/lib/narrativeMemory";
import { loadNexusWorldState, saveNexusWorldState, wipeClientNexoWorld } from "@/lib/nexusWorldState";
import { readLocalClientResetEpoch } from "@/lib/nexoSessionSync";
import { parseFetchJson } from "@/lib/parseFetchJson";
import { MasterSheetEditor } from "./MasterSheetEditor";
import { ROOT_OPERATOR_CIPHER } from "@/lib/sessionMeta";

const ORCH_ACTION_LABEL_ES: Record<string, string> = {
  raid: "evento tipo redada",
  bump_threat: "ajuste de amenaza",
  advance_night: "avance de noche",
  purge_events: "purga de eventos",
  reset: "reinicio de orquestación",
};

function motorSnapshot(ext: boolean, paused: boolean, seed: string) {
  return JSON.stringify({ ext, paused, seed });
}

type DashboardTab = "overview" | "world" | "cast" | "priority" | "engine" | "server";

const NAV: { id: DashboardTab; label: string; hint: string }[] = [
  { id: "overview", label: "Resumen", hint: "Estado, accesos y pendientes" },
  { id: "world", label: "Mundo y trama", hint: "Contexto fijo para el narrador" },
  { id: "cast", label: "Reparto", hint: "Personajes y fichas maestras" },
  { id: "priority", label: "Escena prioritaria", hint: "Se aplica al próximo mensaje del jugador" },
  { id: "engine", label: "Motor narrativo", hint: "IA remota, pausa y contexto global" },
  { id: "server", label: "Servidor y datos", hint: "Orquestación, datos (JSON) y mantenimiento" },
];

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
      {subtitle ? <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{subtitle}</p> : null}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium text-slate-800">{children}</span>;
}

function AiHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs italic leading-relaxed text-slate-500">{children}</p>;
}

const inputClass =
  "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

const btnSecondary =
  "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40";

const btnPrimary =
  "inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40";

const btnDanger =
  "inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-40";

type Props = {
  profiles: ProfileSummary[];
  onProfilesChange: () => void;
  onGoHub: () => void;
  onGoNexus: () => void;
  onRefreshGlobals: () => void;
  onFactoryReset: () => void;
};

export function NarratorCommandCenter({
  profiles,
  onProfilesChange,
  onGoHub,
  onGoNexus,
  onRefreshGlobals,
  onFactoryReset,
}: Props) {
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [entityNpc, setEntityNpc] = useState(false);
  const [chronicle, setChronicle] = useState<ChronicleConfig>(() => loadChronicle());
  const [synInput, setSynInput] = useState("");
  const [synStatus, setSynStatus] = useState<string | null>(null);
  const [manuscriptRaw, setManuscriptRaw] = useState("");
  const [manuscriptLog, setManuscriptLog] = useState<string[] | null>(null);
  const [manuscriptWarn, setManuscriptWarn] = useState<string[] | null>(null);

  const [motorExtLlm, setMotorExtLlm] = useState(true);
  const [motorPaused, setMotorPaused] = useState(false);
  const [motorSeed, setMotorSeed] = useState("");
  const [motorClientEpoch, setMotorClientEpoch] = useState(0);
  const [motorStatus, setMotorStatus] = useState<string | null>(null);
  const [motorLoading, setMotorLoading] = useState(false);
  const [genesisLastSaved, setGenesisLastSaved] = useState(() => JSON.stringify(loadChronicle()));
  const [motorLastSynced, setMotorLastSynced] = useState(() => motorSnapshot(true, false, ""));
  const [orchDisplay, setOrchDisplay] = useState<string>("");
  const [orchBusy, setOrchBusy] = useState(false);
  const [orchStatusLine, setOrchStatusLine] = useState<string | null>(null);
  const [raidIntensity, setRaidIntensity] = useState(4);
  const [threatDelta, setThreatDelta] = useState(1);

  const genesisDirty = useMemo(
    () => JSON.stringify(chronicle) !== genesisLastSaved,
    [chronicle, genesisLastSaved],
  );
  const motorDirty = useMemo(
    () => motorSnapshot(motorExtLlm, motorPaused, motorSeed) !== motorLastSynced,
    [motorExtLlm, motorPaused, motorSeed, motorLastSynced],
  );

  useEffect(() => {
    if (!genesisDirty && !motorDirty) return;
    function warnLeave(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", warnLeave);
    return () => window.removeEventListener("beforeunload", warnLeave);
  }, [genesisDirty, motorDirty]);

  useEffect(() => {
    void pullMotorSettingsBootstrap();
  }, []);

  useEffect(() => {
    if (tab !== "server") return;
    void refreshOrchestration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function refreshOrchestration() {
    setOrchBusy(true);
    setOrchStatusLine(null);
    try {
      const probe = await fetch("/api/nexo-orchestration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cipher: ROOT_OPERATOR_CIPHER, action: "get" }),
      });
      const data = await parseFetchJson<{ ok?: boolean; world?: unknown; error?: string }>(probe);
      if (!probe.ok) {
        setOrchStatusLine(data.error ?? `Respuesta no válida (código ${probe.status})`);
        return;
      }
      setOrchDisplay(JSON.stringify(data.world ?? {}, null, 2));
      setOrchStatusLine("Estado del servidor actualizado.");
      window.setTimeout(() => setOrchStatusLine(null), 2600);
    } catch (e) {
      setOrchStatusLine(e instanceof Error ? e.message : String(e));
    } finally {
      setOrchBusy(false);
    }
  }

  async function runOrchestrationAction(action: string, extras?: Record<string, unknown>) {
    setOrchBusy(true);
    setOrchStatusLine(null);
    try {
      const probe = await fetch("/api/nexo-orchestration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cipher: ROOT_OPERATOR_CIPHER, action, ...extras }),
      });
      const data = await parseFetchJson<{ ok?: boolean; world?: unknown; error?: string }>(probe);
      if (!probe.ok) {
        setOrchStatusLine(data.error ?? `Respuesta no válida (código ${probe.status})`);
        return;
      }
      setOrchDisplay(JSON.stringify(data.world ?? {}, null, 2));
      setOrchStatusLine(
        `Acción completada · ${ORCH_ACTION_LABEL_ES[action] ?? action}`,
      );
      window.setTimeout(() => setOrchStatusLine(null), 3200);
    } catch (e) {
      setOrchStatusLine(e instanceof Error ? e.message : String(e));
    } finally {
      setOrchBusy(false);
    }
  }

  async function pullMotorSettingsBootstrap() {
    setMotorLoading(true);
    setMotorStatus(null);
    try {
      const res = await fetch("/api/operator-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cipher: ROOT_OPERATOR_CIPHER, action: "get" }),
      });
      const data = await parseFetchJson<{
        ok?: boolean;
        externalLlmEnabled?: boolean;
        narratorChannelPaused?: boolean;
        seedContext?: string;
        clientResetEpoch?: number;
        error?: string;
      }>(res);
      if (!res.ok) {
        setMotorStatus(data.error || `Respuesta no válida (código ${res.status})`);
        return;
      }
      const ext = data.externalLlmEnabled ?? true;
      const paused = data.narratorChannelPaused ?? false;
      const seed = typeof data.seedContext === "string" ? data.seedContext : "";
      setMotorExtLlm(ext);
      setMotorPaused(paused);
      setMotorSeed(seed);
      setMotorClientEpoch(typeof data.clientResetEpoch === "number" ? data.clientResetEpoch : 0);
      setMotorLastSynced(motorSnapshot(ext, paused, seed));
      setMotorStatus("Opciones del motor cargadas desde el servidor.");
      window.setTimeout(() => setMotorStatus(null), 3200);
    } catch (e) {
      setMotorStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setMotorLoading(false);
    }
  }

  async function pullMotorSettings() {
    return pullMotorSettingsBootstrap();
  }

  async function pushMotorSettings() {
    setMotorLoading(true);
    setMotorStatus(null);
    try {
      const res = await fetch("/api/operator-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cipher: ROOT_OPERATOR_CIPHER,
          action: "save",
          externalLlmEnabled: motorExtLlm,
          narratorChannelPaused: motorPaused,
          seedContext: motorSeed,
        }),
      });
      const data = await parseFetchJson<{
        ok?: boolean;
        clientResetEpoch?: number;
        error?: string;
      }>(res);
      if (!res.ok) {
        setMotorStatus(data.error || `Respuesta no válida (código ${res.status})`);
        return;
      }
      if (typeof data.clientResetEpoch === "number") setMotorClientEpoch(data.clientResetEpoch);
      setMotorLastSynced(motorSnapshot(motorExtLlm, motorPaused, motorSeed));
      setMotorStatus("Cambios guardados en el servidor.");
      window.setTimeout(() => setMotorStatus(null), 3800);
    } catch (e) {
      setMotorStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setMotorLoading(false);
    }
  }

  async function pushGlobalClientReset() {
    setMotorLoading(true);
    setMotorStatus(null);
    try {
      if (
        !window.confirm(
          "Se incrementará la versión global en el servidor. Los navegadores borrarán datos locales (personajes, chat, mundo, génesis en blanco) al sincronizar. ¿Continuar?",
        )
      ) {
        return;
      }
      const res = await fetch("/api/operator-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cipher: ROOT_OPERATOR_CIPHER, action: "reset_all_clients" }),
      });
      const data = await parseFetchJson<{
        ok?: boolean;
        clientResetEpoch?: number;
        orchestrationReset?: boolean;
        error?: string;
      }>(res);
      if (!res.ok) {
        setMotorStatus(data.error || `Respuesta no válida (código ${res.status})`);
        return;
      }
      setMotorClientEpoch(typeof data.clientResetEpoch === "number" ? data.clientResetEpoch : motorClientEpoch + 1);
      setMotorStatus("Versión global actualizada. Los clientes limpiarán al detectar el cambio.");
      window.setTimeout(() => setMotorStatus(null), 5200);
    } catch (e) {
      setMotorStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setMotorLoading(false);
    }
  }

  async function aplicarMandoIa(remoto: boolean) {
    setMotorLoading(true);
    setMotorStatus(null);
    try {
      const res = await fetch("/api/operator-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cipher: ROOT_OPERATOR_CIPHER,
          action: "save",
          externalLlmEnabled: remoto,
          narratorChannelPaused: motorPaused,
          seedContext: motorSeed,
        }),
      });
      const data = await parseFetchJson<{ ok?: boolean; error?: string }>(res);
      if (!res.ok) {
        setMotorStatus(data.error || `Respuesta no válida (código ${res.status})`);
        return;
      }
      setMotorExtLlm(remoto);
      setMotorLastSynced(motorSnapshot(remoto, motorPaused, motorSeed));
      setMotorStatus(
        remoto
          ? "Modelos remotos activados (si el servidor tiene credenciales configuradas)."
          : "Sólo motor local: sin llamadas a modelos remotos.",
      );
      window.setTimeout(() => setMotorStatus(null), 4200);
    } catch (e) {
      setMotorStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setMotorLoading(false);
    }
  }

  function persistGenesis() {
    saveChronicle(chronicle);
    setGenesisLastSaved(JSON.stringify(chronicle));
    setSynStatus("Mundo y trama guardados en este navegador.");
    window.setTimeout(() => setSynStatus(null), 3200);
  }

  function applyGenesisManuscript() {
    const trimmed = manuscriptRaw.trim();
    if (!trimmed) {
      setSynStatus("Pega texto en el importador o usa «Cargar ejemplo».");
      window.setTimeout(() => setSynStatus(null), 4200);
      return;
    }
    const world = loadNexusWorldState();
    const res = compileGenesisManuscript(trimmed, chronicle, world);
    setChronicle(res.chronicle);
    saveNexusWorldState(res.world);
    saveChronicle(res.chronicle);
    setGenesisLastSaved(JSON.stringify(res.chronicle));
    setManuscriptLog(res.log);
    setManuscriptWarn(res.warnings);
    onRefreshGlobals();
    setSynStatus(
      `Importación lista: ${res.log.length} asignaciones · ${res.warnings.length} aviso(s). También se actualizó el mundo de campaña (local).`,
    );
    window.setTimeout(() => setSynStatus(null), 5200);
  }

  function armSynaptic() {
    setPendingSynapticDisruption(synInput);
    setSynStatus(
      synInput.trim()
        ? "Listo: este texto se inyectará en el próximo envío del jugador al narrador."
        : "Cola vaciada: no se inyectará nada extra.",
    );
    window.setTimeout(() => setSynStatus(null), 4200);
  }

  function spawnEntity() {
    createProfileEntity(entityNpc);
    onProfilesChange();
    onRefreshGlobals();
    setSynStatus(`Nueva ficha (${entityNpc ? "NPC" : "jugador"}) creada.`);
    window.setTimeout(() => setSynStatus(null), 2800);
  }

  const statusPill = (ok: boolean, label: string) => (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        ok ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
      }`}
    >
      {label}
    </span>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 antialiased">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="border-b border-slate-200 px-4 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Director de campaña</p>
            <h1 className="mt-1 text-lg font-bold tracking-tight text-slate-900">Panel de configuración</h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Mismo motor que el juego: aquí defines el contexto estable y supervisas el servidor.
            </p>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 p-2">
            {NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setTab(n.id)}
                className={`rounded-xl px-3 py-2.5 text-left transition ${
                  tab === n.id
                    ? "bg-indigo-50 font-semibold text-indigo-950 ring-1 ring-indigo-200"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="block text-sm">{n.label}</span>
                <span className="mt-0.5 block text-xs font-normal text-slate-500">{n.hint}</span>
              </button>
            ))}
          </nav>
          <div className="space-y-2 border-t border-slate-200 p-3">
            <button type="button" className={`${btnSecondary} w-full text-xs`} onClick={onGoHub}>
              Volver al registro de perfiles
            </button>
            <button type="button" className={`${btnPrimary} w-full text-xs`} onClick={onGoNexus}>
              Abrir partida (Nexo)
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2 lg:hidden">
            {NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setTab(n.id)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap ${
                  tab === n.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>

          <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Sección: <span className="text-slate-800">{NAV.find((x) => x.id === tab)?.label}</span>
                </p>
                <p className="mt-1 text-sm text-slate-600">{NAV.find((x) => x.id === tab)?.hint}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btnSecondary} onClick={onGoHub}>
                  Registro CV
                </button>
                <button type="button" className={btnPrimary} onClick={onGoNexus}>
                  Ir a la partida
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-8">
            {synStatus ? (
              <div
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-950"
                role="status"
              >
                {synStatus}
              </div>
            ) : null}

            {genesisDirty || motorDirty ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
                <p className="font-semibold">Hay cambios sin guardar</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-amber-900/90">
                  {genesisDirty ? (
                    <li>
                      <strong className="font-medium">Mundo y trama:</strong> pulsa «Guardar en este equipo» en la
                      sección Mundo y trama (o usa el atajo del resumen).
                    </li>
                  ) : null}
                  {motorDirty ? (
                    <li>
                      <strong className="font-medium">Motor:</strong> pulsa «Guardar en servidor» en Motor narrativo
                      (los interruptores de IA también guardan al aplicarse).
                    </li>
                  ) : null}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  {genesisDirty ? (
                    <button type="button" className={btnPrimary} onClick={persistGenesis}>
                      Guardar mundo y trama (local)
                    </button>
                  ) : null}
                  {motorDirty ? (
                    <button type="button" className={btnPrimary} disabled={motorLoading} onClick={() => void pushMotorSettings()}>
                      Guardar motor (servidor)
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {tab === "overview" ? (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Card title="Mundo y trama" subtitle="Texto que recibe el narrador en cada llamada.">
                    <div className="flex items-center gap-2">
                      {statusPill(!genesisDirty, !genesisDirty ? "Guardado" : "Borrador")}
                    </div>
                    <button type="button" className={btnSecondary} onClick={() => setTab("world")}>
                      Editar contexto
                    </button>
                  </Card>
                  <Card title="Motor en servidor" subtitle="IA remota, pausa y resumen global.">
                    <div className="flex items-center gap-2">
                      {statusPill(!motorDirty, !motorDirty ? "Sincronizado" : "Pendiente de subir")}
                    </div>
                    <button type="button" className={btnSecondary} onClick={() => setTab("engine")}>
                      Abrir motor
                    </button>
                  </Card>
                  <Card title="Fichas en este navegador" subtitle="Personajes disponibles para editar.">
                    <p className="text-2xl font-semibold text-slate-900">{profiles.length}</p>
                    <button type="button" className={btnSecondary} onClick={() => setTab("cast")}>
                      Gestionar reparto
                    </button>
                  </Card>
                  <Card title="Versión global de clientes" subtitle="Para forzar reset en todos los equipos.">
                    <p className="font-mono text-lg text-slate-800">{motorClientEpoch}</p>
                    <p className="text-xs text-slate-500">
                      Este navegador: <span className="font-mono">{readLocalClientResetEpoch()}</span>
                    </p>
                  </Card>
                </div>

                <Card
                  title="Lista de verificación para una partida jugable"
                  subtitle="Orden sugerido; puedes generar borradores con una IA externa y pegarlos aquí."
                >
                  <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
                    <li>
                      Completa <button type="button" className="font-medium text-indigo-700 underline" onClick={() => setTab("world")}>Mundo y trama</button>{" "}
                      (lore, ambiente, tensión política, estado del mundo, cómo se relacionan los canales de juego).
                    </li>
                    <li>
                      Revisa <button type="button" className="font-medium text-indigo-700 underline" onClick={() => setTab("cast")}>Reparto</button> y las fichas
                      maestras.
                    </li>
                    <li>
                      En <button type="button" className="font-medium text-indigo-700 underline" onClick={() => setTab("engine")}>Motor narrativo</button>, carga
                      desde servidor, ajusta el contexto global y guarda.
                    </li>
                    <li>
                      Opcional: <button type="button" className="font-medium text-indigo-700 underline" onClick={() => setTab("priority")}>Escena prioritaria</button>{" "}
                      si quieres forzar un giro en el próximo mensaje del jugador.
                    </li>
                  </ol>
                </Card>
              </div>
            ) : null}

            {tab === "world" ? (
              <div className="mx-auto max-w-4xl space-y-6">
                <Card
                  title="1 · Lore que no cambia en cada mensaje"
                  subtitle="Facciones, barrios, tabúes, calendario interno. Cuanto más concreto, menos contradicciones del narrador."
                >
                  <FieldLabel>Antecedentes y reglas del mundo</FieldLabel>
                  <AiHint>
                    Tip: pide a un asistente de IA que «expanda estas viñetas en 8 viñetas de una ciudad X con tono Y» y
                    pega el resultado aquí; luego refina las líneas rojas.
                  </AiHint>
                  <textarea
                    value={chronicle.foundations}
                    onChange={(e) => setChronicle((c) => ({ ...c, foundations: e.target.value }))}
                    rows={10}
                    className={inputClass}
                    placeholder="Ej.: Camarilla reconoce al Sheriff hasta marzo. El barrio norte está en obras; los cazadores no actúan de día. …"
                  />
                </Card>

                <Card
                  title="2 · Escenario sensorial"
                  subtitle="Qué ve, huele y siente el grupo la mayoría de las noches (no la trama, el envoltorio)."
                >
                  <FieldLabel>Ambiente físico y social</FieldLabel>
                  <AiHint>
                    Tip: una IA puede convertir «lista de 5 adjetivos» en un párrafo; recorta lo que sobre.
                  </AiHint>
                  <textarea
                    value={chronicle.AMBIENTE}
                    onChange={(e) => setChronicle((c) => ({ ...c, AMBIENTE: e.target.value }))}
                    rows={5}
                    className={inputClass}
                    placeholder="Luz, clima, densidad de gente, ruido, olores, infraestructura…"
                  />
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card
                    title="3 · Conflicto político"
                    subtitle="Quién presiona a quién: príncipe, barones, mortalidad, segunda inquisición, etc."
                  >
                    <FieldLabel>Tensión principal</FieldLabel>
                    <textarea
                      value={chronicle.TENSION}
                      onChange={(e) => setChronicle((c) => ({ ...c, TENSION: e.target.value }))}
                      rows={6}
                      className={inputClass}
                      placeholder="Quién gana si nadie actúa; qué se pierde si los personajes fallan."
                    />
                  </Card>
                  <Card title="4 · Estado del mundo hoy" subtitle="Hechos recientes que deben pesar en la próxima sesión.">
                    <FieldLabel>Situación actual</FieldLabel>
                    <textarea
                      value={chronicle.ESTADO_GLOBAL}
                      onChange={(e) => setChronicle((c) => ({ ...c, ESTADO_GLOBAL: e.target.value }))}
                      rows={6}
                      className={inputClass}
                      placeholder="Rumores instalados, consecuencias de la última sesión, plazos que vencen…"
                    />
                  </Card>
                </div>

                <Card
                  title="5 · Canales de juego"
                  subtitle="Si usas hilo principal, paralelo o mesa en vivo: explica cómo se conectan para no romper continuidad."
                >
                  <FieldLabel>Relación entre canales</FieldLabel>
                  <textarea
                    value={chronicle.VINCULO_HILOS}
                    onChange={(e) => setChronicle((c) => ({ ...c, VINCULO_HILOS: e.target.value }))}
                    rows={4}
                    className={inputClass}
                    placeholder="Ej.: El viernes en vivo alimenta el rumor que el domingo investiga el hilo principal…"
                  />
                </Card>

                <Card
                  title="Importación por texto (avanzado)"
                  subtitle="Pega bloques con formato CLAVE: valor para rellenar arcos, antagonistas y marcas. Se fusiona con lo que ya escribiste arriba."
                >
                  <details className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <summary className="cursor-pointer text-sm font-medium text-slate-800">Ver lista de claves admitidas</summary>
                    <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-slate-600">{GENESIS_MANUSCRIPT_REFERENCE}</pre>
                  </details>
                  <textarea
                    value={manuscriptRaw}
                    onChange={(e) => setManuscriptRaw(e.target.value)}
                    rows={8}
                    className={inputClass}
                    placeholder="Opcional: GENESIS_START … CIUDAD: … ANTAGONISTA: … GENESIS_END"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={btnSecondary} onClick={() => setManuscriptRaw(GENESIS_MANUSCRIPT_EXAMPLE)}>
                      Cargar ejemplo
                    </button>
                    <button type="button" className={btnPrimary} onClick={applyGenesisManuscript}>
                      Compilar importación
                    </button>
                    <label className={`${btnSecondary} cursor-pointer`}>
                      <input
                        type="file"
                        accept=".txt,text/plain"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          void f.text().then((t) => {
                            setManuscriptRaw(t);
                            setSynStatus(`Archivo «${f.name}» cargado.`);
                            window.setTimeout(() => setSynStatus(null), 2800);
                          });
                          e.target.value = "";
                        }}
                      />
                      Subir .txt
                    </label>
                  </div>
                  {manuscriptLog?.length ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                      <p className="font-medium text-slate-800">Última compilación</p>
                      <ul className="mt-2 list-inside list-disc">
                        {manuscriptLog.map((x, i) => (
                          <li key={`${i}-${x}`}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {manuscriptWarn?.length ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                      <p className="font-medium">Avisos</p>
                      <ul className="mt-2 list-inside list-disc">
                        {manuscriptWarn.map((w, i) => (
                          <li key={`${i}-${w}`}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </Card>

                <div className="flex flex-wrap gap-3">
                  <button type="button" className={btnPrimary} onClick={persistGenesis}>
                    Guardar en este equipo
                  </button>
                  <p className="text-xs text-slate-500 self-center">Se guarda en el almacenamiento local del navegador (como el juego).</p>
                </div>
              </div>
            ) : null}

            {tab === "cast" ? (
              <div className="mx-auto max-w-4xl space-y-6">
                <Card
                  title="Nueva ficha rápida"
                  subtitle="Crea un personaje vacío para completarlo después en el editor maestro."
                >
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={entityNpc} onChange={(e) => setEntityNpc(e.target.checked)} />
                    Marcar como NPC (solo metadato en la ficha)
                  </label>
                  <button type="button" className={btnPrimary} onClick={spawnEntity}>
                    Crear ficha vacía
                  </button>
                </Card>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="text-base font-semibold text-slate-900">Editor maestro de fichas</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Mismos datos que usa la partida: nombre, clan, atributos, disciplinas, etc.
                  </p>
                  <div className="mt-4">
                    <MasterSheetEditor
                      summaries={profiles}
                      onSaved={() => {
                        onProfilesChange();
                        onRefreshGlobals();
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {tab === "priority" ? (
              <div className="mx-auto max-w-2xl">
                <Card
                  title="Inyección en el próximo envío"
                  subtitle="Este texto se añade con prioridad al contexto cuando un jugador escribe en el canal. Úsalo para un giro, un rumor o una presencia que debe aparecer ya."
                >
                  <AiHint>
                    Tip: escribe en imperativo qué debe ser cierto en la escena («Hay un dron encendido sobre el techo»)
                    en lugar de instrucciones al modelo («no hagas X»).
                  </AiHint>
                  <textarea
                    value={synInput}
                    onChange={(e) => setSynInput(e.target.value)}
                    rows={8}
                    className={inputClass}
                    placeholder="Ej.: Un helicóptero térmico recorre la ribera; nadie avisó al Príncipe."
                  />
                  <button type="button" className={btnPrimary} onClick={armSynaptic}>
                    Activar para el próximo mensaje
                  </button>
                </Card>
              </div>
            ) : null}

            {tab === "engine" ? (
              <div className="mx-auto max-w-3xl space-y-6">
                <Card title="Modelos remotos" subtitle="Si el despliegue tiene API keys, el narrador puede usar modelos externos; si no, el motor local responde igual.">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={motorLoading}
                      onClick={() => void aplicarMandoIa(true)}
                      className={`${btnPrimary} ${motorExtLlm ? "ring-2 ring-indigo-300" : ""}`}
                    >
                      Permitir modelos remotos
                    </button>
                    <button
                      type="button"
                      disabled={motorLoading}
                      onClick={() => void aplicarMandoIa(false)}
                      className={btnSecondary}
                    >
                      Sólo motor local
                    </button>
                  </div>
                  <p className="text-xs text-slate-600">
                    Estado actual:{" "}
                    <strong>{motorExtLlm ? "remotos permitidos (si hay credenciales)" : "bloqueado · local únicamente"}</strong>
                  </p>
                </Card>

                <Card title="Sincronización" subtitle="Lee el estado del servidor antes de editar; guarda cuando termines.">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={motorLoading} className={btnSecondary} onClick={() => void pullMotorSettings()}>
                      Cargar desde servidor
                    </button>
                    <button type="button" disabled={motorLoading} className={btnPrimary} onClick={() => void pushMotorSettings()}>
                      Guardar en servidor
                    </button>
                  </div>
                </Card>

                <Card title="Pausa del canal de jugador" subtitle="Bloquea narrador y tiradas del jugador en la app; esta consola sigue funcionando.">
                  <label className="flex items-center gap-2 text-sm text-slate-800">
                    <input
                      type="checkbox"
                      checked={motorPaused}
                      onChange={(e) => setMotorPaused(e.target.checked)}
                      disabled={motorLoading}
                    />
                    Canal de jugador pausado
                  </label>
                </Card>

                <Card
                  title="Contexto global de campaña"
                  subtitle="Resumen que el servidor envía al narrador además de la Génesis: fechas internas, plazos, tono, líneas rojas."
                >
                  <AiHint>
                    Tip: una IA puede armar un resumen de guion maestro de 15 líneas a partir de tus notas; pégalo y ajusta
                    los nombres propios.
                  </AiHint>
                  <textarea
                    value={motorSeed}
                    onChange={(e) => setMotorSeed(e.target.value)}
                    rows={12}
                    disabled={motorLoading}
                    className={inputClass}
                    placeholder="Ej.: Año interno 2026. El Sheriff cobra tributo antes del solsticio. Rumor: infiltrados en Providencia…"
                  />
                </Card>

                <Card
                  title="Nueva crónica en todos los clientes"
                  subtitle="Incrementa la versión global: cada navegador borrará datos locales al detectarlo. Muy destructivo."
                >
                  <button type="button" disabled={motorLoading} className={btnDanger} onClick={() => void pushGlobalClientReset()}>
                    Forzar reset global de clientes
                  </button>
                </Card>

                {motorStatus ? (
                  <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{motorStatus}</p>
                ) : null}
              </div>
            ) : null}

            {tab === "server" ? (
              <div className="mx-auto max-w-4xl space-y-6">
                <Card
                  title="Orquestación en servidor"
                  subtitle="Estado compartido (facciones, crisis, memoria agregada) si el despliegue tiene base de datos configurada. Si no, verás errores al refrescar: es esperable en local sin Redis."
                >
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={orchBusy} className={btnSecondary} onClick={() => void refreshOrchestration()}>
                      Actualizar vista JSON
                    </button>
                    <button
                      type="button"
                      disabled={orchBusy}
                      className={btnSecondary}
                      onClick={() => void runOrchestrationAction("raid", { intensity: raidIntensity })}
                    >
                      Evento tipo redada
                    </button>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      Intensidad
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={raidIntensity}
                        onChange={(e) => setRaidIntensity(Math.min(5, Math.max(1, Number(e.target.value) || 4)))}
                        className="w-14 rounded border border-slate-300 px-2 py-1 text-sm"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={orchBusy}
                      className={btnSecondary}
                      onClick={() => void runOrchestrationAction("bump_threat", { delta: threatDelta })}
                    >
                      Ajustar amenaza
                    </button>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      Delta
                      <input
                        type="number"
                        step={0.25}
                        min={-2}
                        max={2}
                        value={threatDelta}
                        onChange={(e) => setThreatDelta(Number(e.target.value) || 1)}
                        className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
                      />
                    </label>
                    <button type="button" disabled={orchBusy} className={btnSecondary} onClick={() => void runOrchestrationAction("advance_night")}>
                      Avanzar noche
                    </button>
                    <button type="button" disabled={orchBusy} className={btnSecondary} onClick={() => void runOrchestrationAction("purge_events")}>
                      Purgar eventos
                    </button>
                    <button
                      type="button"
                      disabled={orchBusy}
                      className={btnDanger}
                      onClick={() => {
                        if (!window.confirm("¿Restaurar la orquestación del servidor a valores iniciales?")) return;
                        void runOrchestrationAction("reset");
                      }}
                    >
                      Restaurar orquestación
                    </button>
                  </div>
                  {orchStatusLine ? <p className="text-sm text-slate-700">{orchStatusLine}</p> : null}
                  <pre className="max-h-[min(420px,55vh)] overflow-auto rounded-lg border border-slate-800 bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
                    {orchDisplay.trim() ? orchDisplay : orchBusy ? "…" : "Pulsa «Actualizar vista JSON»."}
                  </pre>
                </Card>

                <Card
                  title="Reinicio solo en este navegador"
                  subtitle="No toca el servidor. Útil para ensayar sin borrar la campaña remota."
                >
                  <p className="text-sm text-slate-600">
                    Borra perfiles locales, conversación, mundo de campaña en este equipo. La Génesis guardada en local
                    se conserva salvo que elijas un reinicio más agresivo abajo.
                  </p>
                  <button
                    type="button"
                    className={btnDanger}
                    onClick={() => {
                      if (!window.confirm("¿Reinicio local? Se borran fichas y chat en este equipo.")) return;
                      if (!window.confirm("Confirmación final.")) return;
                      try {
                        onFactoryReset();
                        setOrchStatusLine("Reinicio local hecho.");
                        window.setTimeout(() => setOrchStatusLine(null), 5200);
                      } catch (e) {
                        setOrchStatusLine(e instanceof Error ? e.message : String(e));
                      }
                    }}
                  >
                    Reinicio local (conserva Génesis guardada)
                  </button>
                </Card>

                <Card
                  title="Limpieza fina del cliente"
                  subtitle="Transcripción del canal y resúmenes; el último bloque borra también el mundo Nexo local."
                >
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={btnSecondary}
                      onClick={() => {
                        if (!window.confirm("¿Vaciar la transcripción del canal en este equipo?")) return;
                        wipeLocalNexoTranscript();
                        onRefreshGlobals();
                        setOrchStatusLine("Transcripción vaciada.");
                        window.setTimeout(() => setOrchStatusLine(null), 4200);
                      }}
                    >
                      Vaciar transcripción
                    </button>
                    <button
                      type="button"
                      className={btnSecondary}
                      onClick={() => {
                        if (!window.confirm("¿Borrar transcripción y resúmenes por hilo?")) return;
                        wipeLocalNexoTranscript();
                        wipeLocalRollingState();
                        onRefreshGlobals();
                        setOrchStatusLine("Transcripción y resúmenes reiniciados.");
                        window.setTimeout(() => setOrchStatusLine(null), 4200);
                      }}
                    >
                      Transcripción + resúmenes
                    </button>
                    <button
                      type="button"
                      className={btnDanger}
                      onClick={() => {
                        if (!window.confirm("¿Borrar transcripción, resúmenes y mundo Nexo local (misiones, marcas)?")) return;
                        if (!window.confirm("Segunda confirmación.")) return;
                        wipeLocalNexoTranscript();
                        wipeLocalRollingState();
                        wipeClientNexoWorld();
                        onRefreshGlobals();
                        setOrchStatusLine("Cliente reiniciado (duro).");
                        window.setTimeout(() => setOrchStatusLine(null), 4800);
                      }}
                    >
                      Reinicio duro (incluye mundo local)
                    </button>
                  </div>
                </Card>
              </div>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}
