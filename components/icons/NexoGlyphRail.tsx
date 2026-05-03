"use client";

import { motion, useReducedMotion } from "framer-motion";
import { NexusLibrary } from "@/components/icons/NexusLibrary";
import { detectNexoGlyphHints, glyphKindLabel, type NexoGlyphKind } from "@/lib/icons/glyphSignals";
import {
  extractNexoGlyphTokenKindsFromTokens,
  stripNexoGlyphTokenLiterals,
} from "@/lib/icons/nexoGlyphTokens";

const MAX_RAIL = 4;

type Props = {
  text: string;
  /** σ mesa (0–5) — modula glifo inquisición en riel. */
  sigma?: number;
  /** Hambre 0–5 — pulso en glifo sangre. */
  hunger?: number;
  /** Glifos fijos (p. ej. MANIFESTAR → azar). */
  extraHints?: readonly NexoGlyphKind[];
  className?: string;
};

function GlyphFor({
  kind,
  sigma,
  bloodPulse,
}: {
  kind: NexoGlyphKind;
  sigma: number;
  bloodPulse: boolean;
}) {
  switch (kind) {
    case "inquisition":
      return <NexusLibrary.Inquisicion sigma={sigma} className="h-5 w-5 sm:h-6 sm:w-6" />;
    case "blood":
      return <NexusLibrary.Sangre className="h-5 w-5 sm:h-6 sm:w-6" pulse={bloodPulse} />;
    case "destiny":
      return <NexusLibrary.Destino className="h-5 w-5 text-[color:var(--terminal)] sm:h-6 sm:w-6" />;
    case "terminal":
      return <NexusLibrary.Cronista className="h-5 w-5 sm:h-6 sm:w-6" />;
    case "circuit":
      return <NexusLibrary.Circuit className="h-5 w-5 sm:h-6 sm:w-6" />;
    case "vastago":
      return <NexusLibrary.Vastago className="h-5 w-5 sm:h-6 sm:w-6" />;
    default:
      return null;
  }
}

function mergeHints(text: string, extra?: readonly NexoGlyphKind[]): NexoGlyphKind[] {
  const seen = new Set<NexoGlyphKind>();
  const out: NexoGlyphKind[] = [];
  for (const e of extra ?? []) {
    if (seen.has(e)) continue;
    seen.add(e);
    out.push(e);
    if (out.length >= MAX_RAIL) return out;
  }
  for (const e of extractNexoGlyphTokenKindsFromTokens(text)) {
    if (seen.has(e)) continue;
    seen.add(e);
    out.push(e);
    if (out.length >= MAX_RAIL) return out;
  }
  for (const k of detectNexoGlyphHints(stripNexoGlyphTokenLiterals(text))) {
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
    if (out.length >= MAX_RAIL) break;
  }
  return out;
}

export function NexoGlyphRail({ text, sigma = 0, hunger = 0, extraHints, className = "" }: Props) {
  const reduceMotion = useReducedMotion();
  const hints = mergeHints(text, extraHints);
  if (!hints.length) return null;

  const bloodPulse = hunger > 2 && hints.includes("blood");

  return (
    <motion.div
      layout
      initial={reduceMotion ? false : { opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`mb-2 flex flex-wrap items-center gap-2 ${className}`}
      aria-label="Glifos SchreckNet"
    >
      <span className="font-mono text-[7px] uppercase tracking-[0.35em] text-neutral-600">Σ_glifos</span>
      <div className="flex items-center gap-1.5 rounded border border-white/[0.06] bg-black/35 px-2 py-1">
        {hints.map((kind) => (
          <motion.span
            key={kind}
            title={glyphKindLabel(kind)}
            initial={reduceMotion ? false : { scale: 0.86, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="inline-flex opacity-90"
          >
            <GlyphFor kind={kind} sigma={sigma} bloodPulse={bloodPulse} />
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}
