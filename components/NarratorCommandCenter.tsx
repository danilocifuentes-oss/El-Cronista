"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { createProfileEntity } from "@/lib/profileStore";
import type { ProfileSummary } from "@/lib/profileStore";
import type { ChronicleConfig } from "@/lib/chronicleConfig";
import { loadChronicle, saveChronicle, setPendingSynapticDisruption } from "@/lib/chronicleConfig";
import { MasterSheetEditor } from "./MasterSheetEditor";

const ROOT = "#b91c1c";

type Tab = "sheets" | "genesis" | "synaptic";

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

  function persistGenesis() {
    saveChronicle(chronicle);
    setSynStatus("Génesis guardada en almacenamiento local.");
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
              Gestión local de fichas, Génesis diegética y tubería sináptica hacia Gemini. Sin autorización en servidor:
              trátalo como llave de desarrollo.
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
      </div>
    </div>
  );
}
