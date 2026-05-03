"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { parseFetchJson } from "@/lib/parseFetchJson";

const LS_KEY = "cronista-bitacora-cache-v1";

type Props = {
  accent: string;
};

export function BitacoraPublica({ accent }: Props) {
  const [lines, setLines] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      const j = JSON.parse(raw) as unknown;
      return Array.isArray(j) ? j.map(String).filter(Boolean).slice(0, 8) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pulso-mundo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await parseFetchJson<{ lines?: unknown }>(res);
      const next = Array.isArray(data.lines)
        ? data.lines.map((x) => String(x).trim()).filter(Boolean).slice(0, 8)
        : [];
      if (next.length) {
        setLines(next);
        localStorage.setItem(LS_KEY, JSON.stringify(next));
      }
    } catch {
      /* silencio — pulso opcional */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (lines.length === 0) void refresh();
  }, [lines.length, refresh]);

  return (
    <div className="border-b border-[#222] bg-black">
      <header
        className="flex items-center justify-between gap-2 border-b border-[#222] px-3 py-2 font-mono text-[8px] uppercase tracking-[0.32em]"
        style={{ color: accent }}
      >
        <span>BITÁCORA PÚBLICA</span>
        <button
          type="button"
          disabled={loading}
          onClick={() => void refresh()}
          title="Actualizar pulso del mundo (Gemini)"
          className="border border-[#222] px-2 py-1 text-[8px] uppercase tracking-wider text-neutral-500 hover:border-neutral-600 hover:text-neutral-400 disabled:opacity-40"
        >
          {loading ? "…" : "ACT"}
        </button>
      </header>
      <ul className="max-h-[40vh] space-y-2 overflow-y-auto p-3 lg:max-h-[28vh]">
        {lines.length === 0 ? (
          <li className="text-[9px] leading-relaxed text-neutral-600">Sin entradas — pulsa ACT.</li>
        ) : (
          lines.map((line, i) => (
            <motion.li
              key={`${i}-${line.slice(0, 12)}`}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-l border-[#333] pl-2 font-mono text-[9px] leading-relaxed text-neutral-400"
            >
              {line}
            </motion.li>
          ))
        )}
      </ul>
    </div>
  );
}
