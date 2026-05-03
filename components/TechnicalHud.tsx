"use client";

import { motion } from "framer-motion";

type Props = {
  healthFilled: number;
  healthMax: number;
  hunger: number;
  /** Texto breve junto a cada hilera (orden: integridad · hambre). */
  compactLabels?: boolean;
  className?: string;
};

export function TechnicalHud({
  healthFilled,
  healthMax,
  hunger,
  compactLabels = false,
  className = "",
}: Props) {
  const h = Math.max(0, Math.min(5, hunger));
  const hf = Math.max(0, Math.min(healthMax, healthFilled));

  const greenHelp =
    "Integridad física (no es salud “audible”). Cada marca llena amortigua heridas; recuperas marcas cuando el Cronista concede cicatrices o tiempo diegético.";
  const redHelp =
    "Hambre (presión hematófaga). Crece cuando no alimentás la sed o el motor refleja consecuencias. A tope dominá la tentación antes de tirar.";
  const labelGreen = compactLabels ? "Integridad física · marcas recuperables" : "Integridad (marca verde cada casilla)";
  const labelRed = compactLabels ? "Hambre / Bestia cercana · marcas hasta llenarse" : "Hambre (marca roja por estrés vampírico)";

  return (
    <div
      className={`flex shrink-0 flex-col gap-3 rounded-lg border border-neutral-900/80 bg-black/35 px-2.5 py-2.5 backdrop-blur-[2px] ${className}`.trim()}
      aria-label="Indicadores de integridad física y hambre"
    >
      <div className="space-y-1.5">
        <p className="text-[8px] font-medium uppercase tracking-[0.22em] text-emerald-800/95" title={greenHelp}>
          {labelGreen}
        </p>
        <motion.div layout className="flex flex-wrap gap-1" aria-hidden title={greenHelp}>
          {Array.from({ length: healthMax }, (_, i) => (
            <motion.span
              key={`v-${i}`}
              layout
              initial={false}
              animate={{ opacity: i < hf ? 1 : 0.42, scale: i < hf ? 1 : 0.94 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                i < hf
                  ? "bg-emerald-500/95 shadow-[0_0_10px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400/30"
                  : "border border-emerald-950/65 bg-transparent"
              }`}
            />
          ))}
        </motion.div>
      </div>
      <div className="space-y-1.5">
        <p className="text-[8px] font-medium uppercase tracking-[0.22em] text-red-950/95" title={redHelp}>
          {labelRed}
        </p>
        <motion.div layout className="flex flex-wrap gap-1" aria-hidden title={redHelp}>
          {Array.from({ length: 5 }, (_, i) => (
            <motion.span
              key={`r-${i}`}
              layout
              initial={false}
              animate={{
                opacity: i < h ? 1 : 0.42,
                scale: i < h ? 1.05 : 0.93,
              }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                i < h
                  ? "bg-[var(--blood)] shadow-[0_0_10px_rgba(139,0,0,0.45)] ring-1 ring-red-950/35"
                  : "border border-red-950/70 bg-transparent"
              }`}
            />
          ))}
        </motion.div>
      </div>
      <p className="border-t border-white/[0.04] pt-2 text-[8px] leading-snug tracking-wide text-neutral-600">
        El gasto reciente de <span className="text-neutral-500">Voluntad</span> en MANIFESTAR o la sangre invertida en
        disciplinas pueden reflejarse después en estos indicadores cuando la mesa lo marque en la hoja.
      </p>
    </div>
  );
}
