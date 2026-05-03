"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ATTRIBUTE_KEYS,
  CLAN_OPTIONS,
  type CharacterSheet,
  type ClanId,
  normalizeCharacterSheet,
} from "@/lib/character";
import {
  getActiveDisciplineKeys,
  SERENO_SKILLS,
  disciplineLabel,
  type DisciplineKey,
} from "@/lib/sereno";
import {
  getActiveProfileId,
  hydrateGlobalsFromBundle,
  loadBundle,
  type ProfileSummary,
  saveProfileBundle,
} from "@/lib/profileStore";

const ROOT = "#b91c1c";

type Props = {
  summaries: ProfileSummary[];
  onSaved?: () => void;
};

function EditorBody({
  profileId,
  summaries,
  onPickChange,
  onSaved,
}: {
  profileId: string;
  summaries: ProfileSummary[];
  onPickChange: (id: string) => void;
  onSaved?: () => void;
}) {
  const bundle = loadBundle(profileId);
  const [draft, setDraft] = useState(() =>
    bundle ? normalizeCharacterSheet(bundle.sheet) : normalizeCharacterSheet({}),
  );
  const [backupJson, setBackupJson] = useState(() =>
    JSON.stringify(bundle ? normalizeCharacterSheet(bundle.sheet) : normalizeCharacterSheet({})),
  );

  const activeDisciplines = useMemo(() => {
    return getActiveDisciplineKeys(draft.clan, draft.caitiffDisciplinePicks);
  }, [draft.clan, draft.caitiffDisciplinePicks]);

  const persist = useCallback(() => {
    if (!bundle) return;
    const nextSheet = normalizeCharacterSheet(draft);
    const nextBundle = { ...bundle, sheet: nextSheet };
    saveProfileBundle(profileId, nextBundle);
    if (getActiveProfileId() === profileId) {
      hydrateGlobalsFromBundle(nextBundle);
    }
    setBackupJson(JSON.stringify(nextSheet));
    onSaved?.();
  }, [bundle, draft, profileId, onSaved]);

  const revert = useCallback(() => {
    try {
      const parsed = JSON.parse(backupJson) as CharacterSheet;
      setDraft(normalizeCharacterSheet(parsed));
    } catch {
      /* ignore */
    }
  }, [backupJson]);

  function patch(p: Partial<CharacterSheet>) {
    setDraft((d) => normalizeCharacterSheet({ ...d, ...p }));
  }

  function patchAttr(key: keyof CharacterSheet["attributes"], v: number) {
    const n = Math.max(1, Math.min(5, Math.round(v)));
    setDraft((d) => normalizeCharacterSheet({ ...d, attributes: { ...d.attributes, [key]: n } }));
  }

  function patchSkill(key: string, v: number) {
    const n = Math.max(0, Math.min(5, Math.round(v)));
    setDraft((d) => normalizeCharacterSheet({ ...d, skills: { ...d.skills, [key]: n } }));
  }

  function patchDisc(key: DisciplineKey, v: number) {
    const n = Math.max(0, Math.min(5, Math.round(v)));
    setDraft((d) => normalizeCharacterSheet({ ...d, disciplines: { ...d.disciplines, [key]: n } }));
  }

  if (!bundle) {
    return (
      <p className="border border-dashed p-4 text-[10px] text-neutral-500" style={{ borderColor: ROOT }}>
        [BUNDLE_NULL]
      </p>
    );
  }

  return (
    <div className="space-y-4 font-mono text-[10px] text-neutral-300">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-widest text-neutral-500">Explorador</span>
          <select
            value={profileId}
            onChange={(e) => onPickChange(e.target.value)}
            className="min-w-[14rem] border bg-black/80 px-2 py-2 text-neutral-200"
            style={{ borderColor: ROOT }}
          >
            {summaries.map((s) => (
              <option key={s.id} value={s.id}>
                {s.isNPC ? "[NPC] " : ""}
                {s.name} · {s.clan}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={revert}
          disabled={!backupJson}
          className="border px-3 py-2 uppercase tracking-widest text-neutral-400 disabled:opacity-40"
          style={{ borderColor: ROOT }}
        >
          Revertir cambios
        </button>
        <button
          type="button"
          onClick={persist}
          className="border px-3 py-2 uppercase tracking-widest text-neutral-100"
          style={{ borderColor: ROOT, backgroundColor: `${ROOT}22` }}
        >
          Persistir en localStorage
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          Nombre
          <input
            value={draft.name}
            onChange={(e) => patch({ name: e.target.value })}
            className="border bg-black/70 px-2 py-1.5 text-neutral-200"
            style={{ borderColor: ROOT }}
          />
        </label>
        <label className="flex flex-col gap-1">
          Linaje
          <select
            value={draft.clan}
            onChange={(e) => patch({ clan: e.target.value as ClanId })}
            className="border bg-black/70 px-2 py-1.5"
            style={{ borderColor: ROOT }}
          >
            {CLAN_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={Boolean(draft.isNPC)}
          onChange={(e) => patch({ isNPC: e.target.checked })}
        />
        <span className="uppercase tracking-widest text-neutral-500">Marcar como NPC (metadato Nexo)</span>
      </label>

      <label className="flex flex-col gap-1">
        Concepto
        <textarea
          value={draft.concept}
          onChange={(e) => patch({ concept: e.target.value })}
          rows={2}
          className="border bg-black/70 px-2 py-1.5 text-neutral-200"
          style={{ borderColor: ROOT }}
        />
      </label>

      <section className="space-y-2 border p-3" style={{ borderColor: ROOT }}>
        <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-500">Atributos (1–5)</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {ATTRIBUTE_KEYS.map((a) => (
            <label key={a.key} className="flex items-center justify-between gap-2">
              <span className="text-neutral-500">{a.label}</span>
              <input
                type="number"
                min={1}
                max={5}
                value={draft.attributes[a.key]}
                onChange={(e) => patchAttr(a.key, Number(e.target.value))}
                className="w-14 border bg-black px-1 py-0.5 text-right"
                style={{ borderColor: ROOT }}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-2 border p-3" style={{ borderColor: ROOT }}>
        <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-500">Habilidades (0–5)</p>
        <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
          {SERENO_SKILLS.map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between gap-2">
              <span className="truncate text-neutral-500">{label}</span>
              <input
                type="number"
                min={0}
                max={5}
                value={draft.skills[key] ?? 0}
                onChange={(e) => patchSkill(key, Number(e.target.value))}
                className="w-14 border bg-black px-1 py-0.5 text-right"
                style={{ borderColor: ROOT }}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-2 border p-3" style={{ borderColor: ROOT }}>
        <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-500">
          Disciplinas activas (0–5 · sin cupo CODEX)
        </p>
        <div className="space-y-1">
          {activeDisciplines.map((k) => (
            <label key={k} className="flex items-center justify-between gap-2">
              <span className="text-neutral-500">{disciplineLabel(k)}</span>
              <input
                type="number"
                min={0}
                max={5}
                value={(draft.disciplines[k] as number) ?? 0}
                onChange={(e) => patchDisc(k, Number(e.target.value))}
                className="w-14 border bg-black px-1 py-0.5 text-right"
                style={{ borderColor: ROOT }}
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}

export function MasterSheetEditor({ summaries, onSaved }: Props) {
  const [manualPick, setManualPick] = useState<string | null>(null);
  const effectiveId =
    summaries.length === 0
      ? null
      : manualPick && summaries.some((s) => s.id === manualPick)
        ? manualPick
        : summaries[0]!.id;

  if (!effectiveId) {
    return (
      <p className="border border-dashed p-4 text-[10px] text-neutral-500" style={{ borderColor: ROOT }}>
        [SIN_FICHAS] · Crea una entidad o entra con código operador para sembrar el Shadow Pack.
      </p>
    );
  }

  return (
    <EditorBody
      key={effectiveId}
      profileId={effectiveId}
      summaries={summaries}
      onPickChange={setManualPick}
      onSaved={onSaved}
    />
  );
}
