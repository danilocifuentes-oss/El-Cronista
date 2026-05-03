import type { NarrativeStrand } from "@/lib/narrativeStrands";

import type { LoreFamily } from "@/lib/narratorKnowledge/loreSnippets";
import { LORE_BY_FAMILY } from "@/lib/narratorKnowledge/loreSnippets";

function stableHash(parts: string[]): number {
  const s = parts.filter(Boolean).join("|");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function chronicleFingerprint(
  chronicle?:
    | {
        readonly AMBIENTE?: unknown;
        readonly TENSION?: unknown;
        readonly ESTADO_GLOBAL?: unknown;
        readonly foundations?: unknown;
        readonly VINCULO_HILOS?: unknown;
      }
    | null,
): string {
  if (!chronicle) return "";
  return [chronicle.AMBIENTE, chronicle.TENSION, chronicle.ESTADO_GLOBAL, chronicle.foundations, chronicle.VINCULO_HILOS]
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .join("·")
    .slice(0, 400);
}

function rankFamilies(opts: {
  strand: NarrativeStrand | string;
  threat: number;
  sheetBlob: string;
  actionBlob: string;
  chronBlob: string;
}): LoreFamily[] {
  const s = `${opts.strand}`.toLowerCase();
  const blob = `${opts.sheetBlob}|${opts.chronBlob}|${opts.actionBlob}`.toLowerCase();

  const base: LoreFamily[] = [];

  const pushDistinct = (...xs: LoreFamily[]) => {
    for (const x of xs) if (!base.includes(x)) base.push(x);
  };

  if (opts.threat >= 6) pushDistinct("si_shadow", "beast_pulse", "blood_economy", "city_institutions");
  else if (opts.threat >= 4) pushDistinct("si_shadow", "masquerade_cost", "blood_economy", "court_whisper");
  else pushDistinct("marginal_humanity", "chile_urbana", "court_whisper", "masquerade_cost");

  if (/inquis|cruz|doctrin| vigil| camara|cámara| dron\b/.test(blob)) pushDistinct("si_shadow", "city_institutions");
  if (/camarill| harp| salon|salón|principe|príncipe| court| reput/.test(blob) || /\b(cam|princi| harp)/.test(s)) {
    pushDistinct("court_whisper", "masquerade_cost", "blood_economy");
  }
  if (/anar| margen| barri| villa| ocup| protest| huelga\b/.test(blob) || /anon|anarq|margen/.test(s)) {
    pushDistinct("marginal_humanity", "beast_pulse", "chile_urbana");
  }
  if (/beast| bestia| frenes| frenz| rabia\b| hambre devor/.test(blob)) pushDistinct("beast_pulse", "blood_economy");
  if (/vitae|\bsangre\b|rebaño|rebano|ghoul|\bclan\b|linaje|sabbat|camarill/.test(blob)) pushDistinct("blood_economy", "court_whisper");
  if (/santiago| huechurab| recoleta| pudahuel| vicuña| plaza italia| plaza baquedano| vicuña mackenna| costanera| mapocho|\bmetro\b|\btransantiago\b| cordiller| valpara| viña/.test(blob)) {
    pushDistinct("chile_urbana", "city_institutions");
  }

  const all: LoreFamily[] = [
    "si_shadow",
    "masquerade_cost",
    "blood_economy",
    "city_institutions",
    "court_whisper",
    "marginal_humanity",
    "chile_urbana",
    "beast_pulse",
  ];
  for (const f of all) pushDistinct(f);

  return base;
}

function pickLine(family: LoreFamily, h: number, salt: number): string {
  const xs = LORE_BY_FAMILY[family];
  if (!xs.length) return "";
  return xs[(h + salt) % xs.length]!.trim();
}

/** 0–2 líneas diegéticas breves, estables respecto al turno (no RNG puro). */
export function selectLoreFragments(input: {
  narrativeStrand: NarrativeStrand | string;
  inquisitionThreat: number;
  sheetSummary?: string | null;
  chronicle?: Parameters<typeof chronicleFingerprint>[0];
  playerAction: string;
  rollingSummary?: string | null;
  worldNexusContext?: string | null;
}): string[] {
  const strand = input.narrativeStrand;
  const threat = Number.isFinite(input.inquisitionThreat) ? input.inquisitionThreat : 0;
  const sheetBlob = (input.sheetSummary ?? "").slice(0, 520);
  const chronBlob = chronicleFingerprint(input.chronicle ?? undefined);
  const actionBlob = input.playerAction.trim().slice(0, 360);
  const roll = (input.rollingSummary ?? "").slice(0, 240);
  const nexus = (input.worldNexusContext ?? "").slice(0, 240);

  const h = stableHash([
    strand,
    String(threat),
    sheetBlob,
    chronBlob,
    actionBlob,
    roll,
    nexus,
  ]);

  const families = rankFamilies({ strand: `${strand}`, threat, sheetBlob, actionBlob, chronBlob });
  if (!families.length) return [];

  const f0 = families[h % families.length]!;
  const f1 = families[(h + 5) % families.length]!;

  const l0 = pickLine(f0, h, 0);
  const mode = (h >> 3) % 3;
  if (mode === 0 || f0 === f1) return l0 ? [l0] : [];

  const l1 = pickLine(f1, h, 11);
  const out = [l0, l1].map((x) => x.trim()).filter(Boolean);
  return Array.from(new Set(out));
}
