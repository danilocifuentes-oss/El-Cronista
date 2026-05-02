"use client";

import { motion } from "framer-motion";

export type ConclaveMate = {
  id: string;
  name: string;
  clan: string;
  status: "refugio" | "caceria" | "conclave" | "desconectado";
};

const STATUS_CODE: Record<ConclaveMate["status"], string> = {
  refugio: "RF",
  caceria: "CR",
  conclave: "CN",
  desconectado: "◇",
};

type Props = {
  mates: ConclaveMate[];
  accent: string;
};

export function ConclavePanel({ mates, accent }: Props) {
  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-l border-[#161616] bg-black/35 lg:w-52">
      <header className="border-b border-[#161616] px-3 py-2 font-mono text-[8px] uppercase tracking-[0.35em]" style={{ color: accent }}>
        {"//_PEERS"}
      </header>
      <ul className="flex-1 space-y-2 overflow-y-auto p-3">
        {mates.map((m) => (
          <motion.li key={m.id} layout className="border border-[#161616] bg-black/50 px-2.5 py-2">
            <p className="font-mono text-[10px] text-neutral-400">{m.name}</p>
            <p className="mt-0.5 text-[9px] text-neutral-700">
              {m.clan}:{STATUS_CODE[m.status]}
            </p>
          </motion.li>
        ))}
      </ul>
    </aside>
  );
}
