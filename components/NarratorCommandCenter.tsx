"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { createProfileEntity } from "@/lib/profileStore";
import type { ProfileSummary } from "@/lib/profileStore";
import type { ChronicleConfig } from "@/lib/chronicleConfig";
import { loadChronicle, saveChronicle, setPendingSynapticDisruption } from "@/lib/chronicleConfig";
import { parseFetchJson } from "@/lib/parseFetchJson";
import { MasterSheetEditor } from "./MasterSheetEditor";
import { ROOT_OPERATOR_CIPHER } from "@/lib/sessionMeta";

const ROOT = "#b91c1c";

function motorSnapshot(ext: boolean, paused: boolean, seed: string) {
  return JSON.stringify({ ext, paused, seed });
}

type Tab = "sheets" | "genesis" | "synaptic" | "motor" | "orquestacion";

type Props = {
  profiles: ProfileSummary[];
  onProfilesChange: () => void;
  onGoHub: () => void;
  onGoNexus: () => void;
  onRefreshGlobals: () => void;
};

export function NarratorCommandCenter({
  profiles,
  onProfilesChange,
  onGoHub,
  onGoNexus,
  onRefreshGlobals,
}: Props) {
  const [tab, setTab] = useState<Tab>("sheets");
  const [entityNpc, setEntityNpc] = useState(false);
  const [chronicle, setChronicle] = useState<ChronicleConfig>(() => loadChronicle());
  const [synInput, setSynInput] = useState("");
  const [synStatus, setSynStatus] = useState<string | null>(null);

  const [motorExtLlm, setMotorExtLlm] = useState(true);
  const [motorPaused, setMotorPaused] = useState(false);
  const [motorSeed, setMotorSeed] = useState("");
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
    if (tab !== "orquestacion") return;
    void refreshOrchestration();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al entrar en la pestaña
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
        setOrchStatusLine(data.error ?? `HTTP ${probe.status}`);
        return;
      }
      setOrchDisplay(JSON.stringify(data.world ?? {}, null, 2));
      setOrchStatusLine("Estado de orquestación sincronizado.");
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
        setOrchStatusLine(data.error ?? `HTTP ${probe.status}`);
        return;
      }
      setOrchDisplay(JSON.stringify(data.world ?? {}, null, 2));
      setOrchStatusLine(`OK · ${action}`);
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
        error?: string;
      }>(res);
      if (!res.ok) {
        setMotorStatus(data.error || `HTTP ${res.status}`);
        return;
      }
      const ext = data.externalLlmEnabled ?? true;
      const paused = data.narratorChannelPaused ?? false;
      const seed = typeof data.seedContext === "string" ? data.seedContext : "";
      setMotorExtLlm(ext);
      setMotorPaused(paused);
      setMotorSeed(seed);
      setMotorLastSynced(motorSnapshot(ext, paused, seed));
      setMotorStatus("Estado del Motor Nexo sincronizado.");
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
      const data = await parseFetchJson<{ ok?: boolean; error?: string }>(res);
      if (!res.ok) {
        setMotorStatus(data.error || `HTTP ${res.status}`);
        return;
      }
      setMotorLastSynced(motorSnapshot(motorExtLlm, motorPaused, motorSeed));
      setMotorStatus("Motor Nexo guardado en el servidor.");
      window.setTimeout(() => setMotorStatus(null), 3800);
    } catch (e) {
      setMotorStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setMotorLoading(false);
    }
  }

  /** Un clic: mismo payload que Guardar pero fija solo `externalLlmEnabled` (mando IA). */
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
        setMotorStatus(data.error || `HTTP ${res.status}`);
        return;
      }
      setMotorExtLlm(remoto);
      setMotorLastSynced(motorSnapshot(remoto, motorPaused, motorSeed));
      setMotorStatus(remoto ? "IA remota activada (Gemini/OpenAI si hay claves)." : "IA remota desactivada · solo motor interno.");
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
    setSynStatus("Génesis guardada en almacenamiento local (persistente en este equipo).");
    window.setTimeout(() => setSynStatus(null), 3200);
  }

  function armSynaptic() {
    setPendingSynapticDisruption(synInput);
    setSynStatus(
      synInput.trim()
        ? "Disrupción armada: se consumirá en el próximo envío al canal (jugador)."
        : "Cola de disrupción vaciada.",
    );
    window.setTimeout(() => setSynStatus(null), 4200);
  }

  function spawnEntity() {
    createProfileEntity(entityNpc);
    onProfilesChange();
    onRefreshGlobals();
    setSynStatus(`Entidad creada (${entityNpc ? "NPC" : "jugador"}).`);
    window.setTimeout(() => setSynStatus(null), 2800);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "sheets", label: "CODEX · Maestro" },
    { id: "genesis", label: "Génesis" },
    { id: "synaptic", label: "Disrupción" },
    { id: "motor", label: "Motor Nexo" },
    { id: "orquestacion", label: "Orquestación" },
  ];

  return (
    <div
      className="relative min-h-screen overflow-auto bg-[#070707] px-4 py-8 font-mono text-neutral-200"
      style={{ ["--root-cobalt"]: ROOT } as CSSProperties}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden text-[min(18vw,140px)] font-bold uppercase tracking-tighter text-[#b91c1c]/[0.06]"
        aria-hidden
      >
        [ACCESO_NIVEL_ALPHA]
      </div>

      <div
        className="relative z-10 mx-auto max-w-5xl border-4 bg-black/55 px-5 py-6 shadow-[inset_0_0_0_1px_#b91c1c44]"
        style={{ borderColor: ROOT }}
      >
        <header className="mb-6 flex flex-col gap-4 border-b border-double pb-5 md:flex-row md:items-end md:justify-between" style={{ borderColor: ROOT }}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em]" style={{ color: ROOT }}>
              OPERADOR_RAÍZ
            </p>
            <h1 className="mt-1 text-lg font-normal tracking-[0.18em] text-neutral-100">CENTRO_DE_MANDO</h1>
            <p className="mt-2 max-w-xl text-[10px] leading-relaxed text-neutral-500">
              Gestión de fichas, Génesis, disrupción, Motor Nexo y orquestación global (Redis Upstash opcional igual que
              la cola multijugador; sin Redis el estado narrativo del servidor puede perderse en cold start salvo disco
              en self-hosted).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onGoHub}
              className="border px-3 py-2 text-[9px] uppercase tracking-widest text-neutral-300"
              style={{ borderColor: ROOT }}
            >
              REGISTRO_CV
            </button>
            <button
              type="button"
              onClick={onGoNexus}
              className="border px-3 py-2 text-[9px] uppercase tracking-widest text-neutral-300"
              style={{ borderColor: ROOT }}
            >
              NEXO (perfil activo)
            </button>
          </div>
        </header>

        <nav className="mb-6 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`border px-4 py-2 text-[9px] uppercase tracking-[0.2em] ${
                tab === t.id ? "text-neutral-100" : "text-neutral-500"
              }`}
              style={{ borderColor: tab === t.id ? ROOT : "#333" }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {(genesisDirty || motorDirty) ? (
          <aside
            className="mb-4 flex flex-col gap-3 border px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
            style={{ borderColor: ROOT, backgroundColor: `${ROOT}12` }}
            role="status"
          >
            <div className="text-[10px] leading-relaxed text-neutral-400">
              <p className="text-[9px] uppercase tracking-[0.28em]" style={{ color: ROOT }}>
                Borradores sin fijar
              </p>
              <ul className="mt-2 list-disc pl-4 marker:text-neutral-600">
                {genesisDirty ? (
                  <li>
                    <strong className="font-normal text-neutral-200">Génesis:</strong> los cambios viven solo en esta
                    pantalla hasta que pulses «Guardar Génesis» (memoria local).
                  </li>
                ) : null}
                {motorDirty ? (
                  <li>
                    <strong className="font-normal text-neutral-200">Motor Nexo:</strong> la IA · pausa · contexto global
                    no quedan en la instancia hasta pulsar «Guardar en servidor» (los botones «Activar / Desactivar IA»
                    también sincronizan estado).
                  </li>
                ) : null}
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              {genesisDirty ? (
                <button
                  type="button"
                  onClick={persistGenesis}
                  className="border px-4 py-2 text-[9px] uppercase tracking-wider text-neutral-200"
                  style={{ borderColor: ROOT }}
                >
                  Fijar Génesis ahora
                </button>
              ) : null}
              {motorDirty ? (
                <button
                  type="button"
                  disabled={motorLoading}
                  onClick={() => void pushMotorSettings()}
                  className="border px-4 py-2 text-[9px] uppercase tracking-wider disabled:opacity-40"
                  style={{ borderColor: ROOT, color: ROOT }}
                >
                  Subir Motor al servidor
                </button>
              ) : null}
            </div>
          </aside>
        ) : null}

        {synStatus ? (
          <p className="mb-4 border px-3 py-2 text-[10px] text-neutral-400" style={{ borderColor: ROOT }}>
            {synStatus}
          </p>
        ) : null}

        {tab === "sheets" ? (
          <div className="space-y-6">
            <section className="border p-4" style={{ borderColor: ROOT }}>
              <p className="mb-3 text-[9px] uppercase tracking-[0.28em] text-neutral-500">Generador de entidades</p>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-[10px]">
                  <input type="checkbox" checked={entityNpc} onChange={(e) => setEntityNpc(e.target.checked)} />
                  NPC (metadato `isNPC`)
                </label>
                <button
                  type="button"
                  onClick={spawnEntity}
                  className="border px-4 py-2 text-[9px] uppercase tracking-widest"
                  style={{ borderColor: ROOT, color: ROOT }}
                >
                  CREAR_ENTIDAD
                </button>
              </div>
            </section>
            <MasterSheetEditor
              summaries={profiles}
              onSaved={() => {
                onProfilesChange();
                onRefreshGlobals();
              }}
            />
          </div>
        ) : null}

        {tab === "genesis" ? (
          <div className="space-y-4">
            <label className="flex flex-col gap-2">
              <span className="text-[9px] uppercase tracking-widest text-neutral-500">Cimientos del mundo</span>
              <textarea
                value={chronicle.foundations}
                onChange={(e) => setChronicle((c) => ({ ...c, foundations: e.target.value }))}
                rows={10}
                className="w-full border bg-black/80 px-3 py-2 text-[11px] leading-relaxed text-neutral-200"
                style={{ borderColor: ROOT }}
                placeholder="Facciiones, barrios tabú, aliados recurrentes, líneas rojas de la crónica…"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-[9px] uppercase tracking-widest text-neutral-500">
                Vínculo entre hilos (principal · paralela · en vivo)
              </span>
              <textarea
                value={chronicle.VINCULO_HILOS}
                onChange={(e) => setChronicle((c) => ({ ...c, VINCULO_HILOS: e.target.value }))}
                rows={4}
                className="w-full border bg-black/80 px-3 py-2 text-[11px] leading-relaxed text-neutral-200"
                style={{ borderColor: ROOT }}
                placeholder="Ej.: La mesa IRL es el viernes; lo jugado en vivo actualiza el rumor que el PJ investiga el domingo en el hilo principal…"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-1">
                <span className="text-[9px] uppercase text-neutral-500">AMBIENTE</span>
                <textarea
                  value={chronicle.AMBIENTE}
                  onChange={(e) => setChronicle((c) => ({ ...c, AMBIENTE: e.target.value }))}
                  rows={4}
                  className="border bg-black/80 px-2 py-1.5 text-[10px]"
                  style={{ borderColor: ROOT }}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[9px] uppercase text-neutral-500">TENSIÓN</span>
                <textarea
                  value={chronicle.TENSION}
                  onChange={(e) => setChronicle((c) => ({ ...c, TENSION: e.target.value }))}
                  rows={4}
                  className="border bg-black/80 px-2 py-1.5 text-[10px]"
                  style={{ borderColor: ROOT }}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[9px] uppercase text-neutral-500">ESTADO_GLOBAL</span>
                <textarea
                  value={chronicle.ESTADO_GLOBAL}
                  onChange={(e) => setChronicle((c) => ({ ...c, ESTADO_GLOBAL: e.target.value }))}
                  rows={4}
                  className="border bg-black/80 px-2 py-1.5 text-[10px]"
                  style={{ borderColor: ROOT }}
                />
              </label>
            </div>
            <button
              type="button"
              onClick={persistGenesis}
              className="border px-5 py-2.5 text-[9px] uppercase tracking-[0.25em]"
              style={{ borderColor: ROOT, backgroundColor: `${ROOT}18` }}
            >
              Guardar Génesis
            </button>
          </div>
        ) : null}

        {tab === "synaptic" ? (
          <div className="space-y-3">
            <p className="text-[10px] leading-relaxed text-neutral-500">
              Inyección prioritaria para el motor narrador. Se integra en el próximo mensaje del jugador al canal (y el
              contexto Génesis acompaña todas las llamadas).
            </p>
            <textarea
              value={synInput}
              onChange={(e) => setSynInput(e.target.value)}
              rows={6}
              className="w-full border bg-black/80 px-3 py-2 text-[11px] text-neutral-200"
              style={{ borderColor: ROOT }}
              placeholder="Ej.: Un helicóptero de vigilancia térmica surca la ribera; nadie avisó al Príncipe."
            />
            <button
              type="button"
              onClick={armSynaptic}
              className="border px-5 py-2.5 text-[9px] uppercase tracking-[0.28em]"
              style={{ borderColor: ROOT, color: ROOT }}
            >
              ARMAR_DISRUPCIÓN
            </button>
          </div>
        ) : null}

        {tab === "orquestacion" ? (
          <div className="space-y-4">
            <p className="text-[10px] leading-relaxed text-neutral-500">
              Estado servidor de facciones, crisis, arco y memoria agregada (inyectado en prompts del narrador / Cronista).
              Requiere clave operador ya validada por esta sesión. Con{" "}
              <code className="text-neutral-400">UPSTASH_REDIS_*</code> el estado sobrevive entre despliegues y réplicas.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={orchBusy}
                onClick={() => void refreshOrchestration()}
                className="border px-3 py-2 text-[9px] uppercase tracking-widest text-neutral-300 disabled:opacity-40"
                style={{ borderColor: ROOT }}
              >
                Refrescar
              </button>
              <button
                type="button"
                disabled={orchBusy}
                onClick={() => void runOrchestrationAction("raid", { intensity: raidIntensity })}
                className="border px-3 py-2 text-[9px] uppercase tracking-widest disabled:opacity-40"
                style={{ borderColor: ROOT, color: ROOT }}
              >
                Raid Inquisición
              </button>
              <label className="flex items-center gap-1 text-[10px] text-neutral-500">
                i
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={raidIntensity}
                  onChange={(e) => setRaidIntensity(Math.min(5, Math.max(1, Number(e.target.value) || 4)))}
                  className="w-12 border bg-black/80 px-1 py-0.5 text-neutral-200"
                  style={{ borderColor: ROOT }}
                />
              </label>
              <button
                type="button"
                disabled={orchBusy}
                onClick={() => void runOrchestrationAction("bump_threat", { delta: threatDelta })}
                className="border px-3 py-2 text-[9px] uppercase tracking-widest disabled:opacity-40"
                style={{ borderColor: ROOT }}
              >
                Subir amenaza
              </button>
              <label className="flex items-center gap-1 text-[10px] text-neutral-500">
                Δ
                <input
                  type="number"
                  step={0.25}
                  min={-2}
                  max={2}
                  value={threatDelta}
                  onChange={(e) => setThreatDelta(Number(e.target.value) || 1)}
                  className="w-14 border bg-black/80 px-1 py-0.5 text-neutral-200"
                  style={{ borderColor: ROOT }}
                />
              </label>
              <button
                type="button"
                disabled={orchBusy}
                onClick={() => void runOrchestrationAction("advance_night")}
                className="border px-3 py-2 text-[9px] uppercase tracking-widest disabled:opacity-40"
                style={{ borderColor: ROOT }}
              >
                +Noche
              </button>
              <button
                type="button"
                disabled={orchBusy}
                onClick={() => void runOrchestrationAction("purge_events")}
                className="border px-3 py-2 text-[9px] uppercase tracking-widest disabled:opacity-40"
                style={{ borderColor: ROOT }}
              >
                Purgar eventos
              </button>
              <button
                type="button"
                disabled={orchBusy}
                onClick={() => {
                  if (!window.confirm("¿Resetear orquestación a valores iniciales?")) return;
                  void runOrchestrationAction("reset");
                }}
                className="border px-3 py-2 text-[9px] uppercase tracking-widest text-red-400/90 disabled:opacity-40"
                style={{ borderColor: "#7f1d1d" }}
              >
                Reset
              </button>
            </div>
            {orchStatusLine ? (
              <p className="border px-3 py-2 text-[10px] text-neutral-400" style={{ borderColor: ROOT }}>
                {orchStatusLine}
              </p>
            ) : null}
            <pre
              className="max-h-[min(420px,55vh)] overflow-auto border bg-black/80 p-3 text-[10px] leading-relaxed text-neutral-300"
              style={{ borderColor: ROOT }}
            >
              {orchDisplay.trim() ? orchDisplay : orchBusy ? "…" : "(pulsa Refrescar)"}
            </pre>
          </div>
        ) : null}

        {tab === "motor" ? (
          <div className="space-y-5">
            <p className="text-[10px] leading-relaxed text-neutral-500">
              El motor se autentica con la misma sesión que abrió el Centro: al entrar se carga el último estado guardado;
              pulsa «Guardar en servidor» para fijar cambios.
            </p>

            <section
              className="rounded border px-4 py-3 shadow-[inset_0_0_0_1px_rgba(185,28,28,0.15)]"
              style={{ borderColor: ROOT }}
            >
              <p className="text-[9px] uppercase tracking-[0.32em]" style={{ color: ROOT }}>
                Mando · IA remota
              </p>
              <p className="mt-1.5 text-[10px] text-neutral-500">
                IA remota opcional: si está desactivada el pipeline sigue con reglas internas y plantillas.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={motorLoading}
                  onClick={() => void aplicarMandoIa(true)}
                  className="border px-4 py-2.5 text-[9px] uppercase tracking-[0.2em] transition disabled:opacity-40"
                  style={{
                    borderColor: ROOT,
                    ...(motorExtLlm ? { backgroundColor: `${ROOT}26`, color: ROOT } : { color: "rgb(212 212 212)" }),
                  }}
                >
                  Activar IA remota
                </button>
                <button
                  type="button"
                  disabled={motorLoading}
                  onClick={() => void aplicarMandoIa(false)}
                  className="border px-4 py-2.5 text-[9px] uppercase tracking-[0.2em] transition disabled:opacity-40"
                  style={{
                    borderColor: ROOT,
                    ...(!motorExtLlm ? { backgroundColor: "rgba(38 38 38 / 0.9)", color: "rgb(250 250 250)" } : {}),
                  }}
                >
                  Desactivar IA · solo interno
                </button>
              </div>
              <p className="mt-3 text-[9px] text-neutral-600">
                Estado:{" "}
                {motorExtLlm
                  ? "Permitidas APIs externas si el deploy tiene claves."
                  : "Bloqueadas · motor interno y plantillas locales."}
              </p>
            </section>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={motorLoading}
                onClick={() => void pullMotorSettings()}
                className="border px-4 py-2 text-[9px] uppercase tracking-widest text-neutral-300 disabled:opacity-40"
                style={{ borderColor: ROOT }}
              >
                Cargar estado
              </button>
              <button
                type="button"
                disabled={motorLoading}
                onClick={() => void pushMotorSettings()}
                className="border px-4 py-2 text-[9px] uppercase tracking-widest disabled:opacity-40"
                style={{ borderColor: ROOT, color: ROOT }}
              >
                Guardar en servidor
              </button>
            </div>

            <label className="flex items-center gap-2 text-[10px] text-neutral-400">
              <input
                type="checkbox"
                checked={motorPaused}
                onChange={(e) => setMotorPaused(e.target.checked)}
                disabled={motorLoading}
              />
              Pausar canal del jugador (bloquea narrador + MANIFESTAR; no afecta esta consola).
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[9px] uppercase tracking-widest text-neutral-500">
                Contexto global de campaña (impulso para empezar o continuar)
              </span>
              <textarea
                value={motorSeed}
                onChange={(e) => setMotorSeed(e.target.value)}
                rows={10}
                disabled={motorLoading}
                className="w-full border bg-black/80 px-3 py-2 text-[11px] leading-relaxed text-neutral-200"
                style={{ borderColor: ROOT }}
                placeholder="Ej.: Año 2026 · El Sheriff exige tributo simbólico antes del solsticio. Rumor: infiltracamarilla en Providencia. Nadie menciona el incidente del Metro aún."
              />
            </label>

            {motorStatus ? (
              <p className="border px-3 py-2 text-[10px] text-neutral-400" style={{ borderColor: ROOT }}>
                {motorStatus}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
