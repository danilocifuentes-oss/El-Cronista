"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  CONCEPT_SELECT_CUSTOM,
  CONCEPTOS_DATA,
  conceptoById,
} from "@/lib/conceptosCodex";

type Patch = {
  concept?: string;
  conceptPresetId?: string | null;
};

type Props = {
  concept: string;
  conceptPresetId: string | null;
  onPatch: (p: Patch) => void;
  inputBase: string;
  labelTooltip?: string;
};

export function ConceptCodexField({
  concept,
  conceptPresetId,
  onPatch,
  inputBase,
  labelTooltip,
}: Props) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const presetRow =
    typeof conceptPresetId === "string" && conceptPresetId.length > 0
      ? conceptoById(conceptPresetId)
      : undefined;
  const selectValue = presetRow ? presetRow.id : CONCEPT_SELECT_CUSTOM;

  return (
    <div className="md:col-span-12">
      <label className="text-[9px] uppercase tracking-widest text-neutral-600" title={labelTooltip}>
        {"&gt;_CONCEPTO"}
      </label>

      <select
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v === CONCEPT_SELECT_CUSTOM) {
            onPatch({ conceptPresetId: null, concept: "" });
            return;
          }
          const row = CONCEPTOS_DATA.find((c) => c.id === v);
          if (row) onPatch({ conceptPresetId: row.id, concept: row.nombre });
        }}
        title={labelTooltip}
        className={`${inputBase} mt-2 cursor-pointer`}
      >
        {CONCEPTOS_DATA.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
        <option value={CONCEPT_SELECT_CUSTOM}>OTRO…</option>
      </select>

      {presetRow ? (
        <div
          className="relative z-40 mt-2 inline-block max-w-full"
          onMouseEnter={() => setTooltipOpen(true)}
          onMouseLeave={() => setTooltipOpen(false)}
          onFocus={() => setTooltipOpen(true)}
          onBlur={() => setTooltipOpen(false)}
          tabIndex={0}
          aria-label={`Concepto seleccionado: ${presetRow.nombre}. Paso el cursor para la descripción.`}
        >
          <span className="cursor-help border-b border-dotted font-mono text-[10px] text-neutral-300 border-[#39ff14]/60">
            {presetRow.nombre}
          </span>
          <AnimatePresence>
            {tooltipOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.12 }}
                className="pointer-events-none absolute left-0 top-full z-[100] mt-1.5 max-w-[min(100%,22rem)] border p-2.5 font-mono text-[9px] leading-relaxed tracking-tight text-neutral-400 shadow-lg"
                style={{
                  backgroundColor: "#0a0a0a",
                  borderColor: "#39ff14",
                  borderWidth: 1,
                }}
              >
                {presetRow.descripcion}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : (
        <input
          value={concept}
          onChange={(e) => onPatch({ concept: e.target.value, conceptPresetId: null })}
          title={labelTooltip}
          placeholder="Describe tu concepto (texto libre)."
          className={`${inputBase} mt-2 placeholder:text-neutral-700`}
        />
      )}
    </div>
  );
}
