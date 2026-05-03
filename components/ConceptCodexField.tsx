"use client";

import { CONCEPT_SELECT_CUSTOM, CONCEPTOS_DATA, conceptoById } from "@/lib/conceptosCodex";

type Patch = {
  concept?: string;
  conceptPresetId?: string | null;
};

type Props = {
  concept: string;
  conceptPresetId: string | null;
  onPatch: (p: Patch) => void;
  inputBase: string;
  readOnly?: boolean;
};

export function ConceptCodexField({ concept, conceptPresetId, onPatch, inputBase, readOnly }: Props) {
  const presetRow =
    typeof conceptPresetId === "string" && conceptPresetId.length > 0
      ? conceptoById(conceptPresetId)
      : undefined;
  const selectValue = presetRow ? presetRow.id : CONCEPT_SELECT_CUSTOM;

  return (
    <div className="md:col-span-12">
      <label className="text-[9px] uppercase tracking-widest text-neutral-600">Concepto</label>

      <select
        value={selectValue}
        disabled={readOnly}
        onChange={(e) => {
          const v = e.target.value;
          if (v === CONCEPT_SELECT_CUSTOM) {
            onPatch({ conceptPresetId: null, concept: "" });
            return;
          }
          const row = CONCEPTOS_DATA.find((c) => c.id === v);
          if (row) onPatch({ conceptPresetId: row.id, concept: row.nombre });
        }}
        className={`${inputBase} mt-2 ${readOnly ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
      >
        {CONCEPTOS_DATA.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
        <option value={CONCEPT_SELECT_CUSTOM}>Otro (texto)</option>
      </select>

      {selectValue === CONCEPT_SELECT_CUSTOM ? (
        <input
          value={concept}
          readOnly={readOnly}
          onChange={(e) => onPatch({ concept: e.target.value, conceptPresetId: null })}
          placeholder="Una línea: rol u oficio visible."
          className={`${inputBase} mt-2 placeholder:text-neutral-700`}
        />
      ) : null}
    </div>
  );
}
