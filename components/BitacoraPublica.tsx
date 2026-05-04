"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { parseFetchJson } from "@/lib/parseFetchJson";

const LS_KEY = "cronista-bitacora-dual-v1";

type Stored = { eco_visible: string[]; eco_sombras: string[] };

type Props = {
  accent: string;
  /** Eco de la crónica solitaria; si está definido, sustituye ciudad/sombras. */
  soloEchoLines?: string[];
};

/** Una línea = un titular corto; evita párrafos en el riel. */
function microNewsLine(line: string, max = 200): string {
  const t = line.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

function parseDual(raw: unknown): Stored | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const v = Array.isArray(o.eco_visible) ? o.eco_visible : Array.isArray(o.ecoVisible) ? o.ecoVisible : [];
  const s = Array.isArray(o.eco_sombras) ? o.eco_sombras : Array.isArray(o.ecoSombras) ? o.ecoSombras : [];
  const eco_visible = v.map(String).filter(Boolean).slice(0, 6);
  const eco_sombras = s.map(String).filter(Boolean).slice(0, 6);
  if (!eco_visible.length && !eco_sombras.length) return null;
  return { eco_visible, eco_sombras };
}

function hydrateFromStorage(): Stored {
  if (typeof window === "undefined") return { eco_visible: [], eco_sombras: [] };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const d = parseDual(JSON.parse(raw) as unknown);
      if (d) return d;
    }
    const legacy = localStorage.getItem("cronista-bitacora-cache-v1");
    if (legacy) {
      const j = JSON.parse(legacy) as unknown;
      if (Array.isArray(j) && j.length) {
        const arr = j.map(String).filter(Boolean);
        const mid = Math.min(4, Math.ceil(arr.length / 2));
        return {
          eco_visible: arr.slice(0, mid),
          eco_sombras: arr.slice(mid, mid + 4),
        };
      }
    }
  } catch {
    /* */
  }
  return { eco_visible: [], eco_sombras: [] };
}

export function BitacoraPublica({ accent, soloEchoLines }: Props) {
  const [bundle, setBundle] = useState<Stored>(() => hydrateFromStorage());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pulso-mundo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await parseFetchJson<Stored & { lines?: unknown }>(res);
      const parsed =
        parseDual(data) ??
        (Array.isArray(data.lines)
          ? {
              eco_visible: (data.lines as string[]).slice(0, 4),
              eco_sombras: (data.lines as string[]).slice(4, 8),
            }
          : null);
      if (parsed && (parsed.eco_visible.length || parsed.eco_sombras.length)) {
        setBundle(parsed);
        localStorage.setItem(LS_KEY, JSON.stringify(parsed));
      }
    } catch {
      /* silencio */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (bundle.eco_visible.length === 0 && bundle.eco_sombras.length === 0) void refresh();
  }, [bundle.eco_visible.length, bundle.eco_sombras.length, refresh]);

  /** Mundo “vivo”: refresco suave cuando la pestaña está visible (no en segundo plano). */
  useEffect(() => {
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      void refresh();
    };
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  if (soloEchoLines !== undefined) {
    return (
      <div className="border-b border-[#222] bg-black">
        <header
          className="border-b border-[#222] px-3 py-2 font-mono text-[8px] uppercase tracking-[0.28em] text-neutral-500"
          style={{ color: accent }}
        >
          Rastro · crónica activa
        </header>
        <ul className="max-h-[min(40vh,18rem)] list-none space-y-2 overflow-y-auto p-3">
          {soloEchoLines.length === 0 ? (
            <li className="text-[9px] leading-relaxed text-neutral-600">Aún no hay elecciones registradas en esta partida.</li>
          ) : (
            soloEchoLines.map((line, i) => (
              <li
                key={`solo-echo-${i}-${line.slice(0, 12)}`}
                className="list-none border-l-[3px] border-[color:var(--terminal)]/40 pl-2.5 font-sans text-[9px] leading-snug text-neutral-400"
              >
                {microNewsLine(line, 220)}
              </li>
            ))
          )}
        </ul>
      </div>
    );
  }

  return (
    <div className="border-b border-[#222] bg-black">
      <header
        className="flex items-center justify-between gap-2 border-b border-[#222] px-3 py-2 font-mono text-[8px] uppercase tracking-[0.28em]"
        style={{ color: accent }}
      >
          <span>Bitácora · ciudad / sombras</span>
        <button
          type="button"
          disabled={loading}
          onClick={() => void refresh()}
          title="Actualizar ecos urbanos"
          className="border border-[#222] px-2 py-1 text-[8px] uppercase tracking-wider text-neutral-500 hover:border-neutral-600 hover:text-neutral-400 disabled:opacity-40"
        >
          {loading ? "…" : "ACT"}
        </button>
      </header>
      <div className="grid max-h-[min(52vh,28rem)] grid-cols-1 gap-0 divide-y divide-[#222] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <EcoColumn
          title="Ciudad visible"
          subtitle="Mortal · banal · política del día"
          lines={bundle.eco_visible}
          borderTint="var(--terminal)"
        />
        <EcoColumn
          title="Sombras del Nexo"
          subtitle="Susurros · paranoia vampírica"
          lines={bundle.eco_sombras}
          borderTint="var(--neon)"
        />
      </div>
    </div>
  );
}

function EcoColumn(props: {
  title: string;
  subtitle: string;
  lines: string[];
  borderTint: string;
}) {
  return (
    <div className="min-h-0">
      <p className="border-b border-[#222] px-3 py-1.5 font-mono text-[7px] uppercase tracking-[0.25em] text-neutral-600">
        {props.title}
        <span className="mt-0.5 block font-sans text-[8px] normal-case tracking-normal text-neutral-500">
          {props.subtitle}
        </span>
      </p>
      <ul className="max-h-[min(42vh,18rem)] list-none space-y-2 overflow-y-auto p-3 sm:max-h-[22rem]">
        {props.lines.length === 0 ? (
          <li className="text-[9px] leading-relaxed text-neutral-600">Vacío · pulsa ACT para actualizar.</li>
        ) : (
          props.lines.map((line, i) => (
            <motion.li
              key={`${props.title}-${i}-${line.slice(0, 8)}`}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              className="list-none border-l-[3px] pl-2 font-sans text-[9px] leading-snug tracking-tight text-neutral-400"
              style={{ borderLeftColor: props.borderTint }}
            >
              <span className="mr-1 text-neutral-600" aria-hidden>
                •
              </span>
              {microNewsLine(line)}
            </motion.li>
          ))
        )}
      </ul>
    </div>
  );
}
