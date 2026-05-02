"use client";

import { motion } from "framer-motion";

export type ConclaveMate = {
  id: string;
  name: string;
  clan: string;
  status: "refugio" | "caceria" | "conclave" | "desconectado";
};

const STATUS_LABEL: Record<ConclaveMate["status"], string> = {
  refugio: "En el refugio",
  caceria: "En cacería",
  conclave: "En cónclave SchreckNet",
  desconectado: "Señal mínima",
};

type Props = {
  mates: ConclaveMate[];
  accent: string;
};

export function ConclavePanel({ mates, accent }: Props) {
  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-neutral-800 bg-neutral-950/90 lg:w-64 sharp-border-inner">
      <header
        className="border-b border-neutral-800 px-4 py-3 font-mono text-xs uppercase tracking-[0.25em]"
        style={{ color: accent }}
      >
        Cónclave
      </header>
      <ul className="flex-1 space-y-2 overflow-y-auto p-4">
        {mates.map((m) => (
          <motion.li
            key={m.id}
            layout
            className="border border-neutral-800 bg-black/60 px-3 py-3 font-mono text-xs sharp-border-inner"
            style={{
              borderLeftWidth: 3,
              borderLeftColor: accent,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            <p className="font-sans text-sm text-neutral-200">{m.name}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-neutral-500">{m.clan}</p>
            <p className="mt-2 text-[10px]" style={{ color: accent }}>
              ● {STATUS_LABEL[m.status]}
            </p>
          </motion.li>
        ))}
      </ul>
    </aside>
  );
}
