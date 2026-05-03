import type { ClanId } from "@/lib/character";
import { clans, type ClanKnowledgeKey } from "@/data/knowledge/clans";
import { disciplines } from "@/data/knowledge/disciplines";
import { sects } from "@/data/knowledge/sects";
import { blood } from "@/data/knowledge/blood";
import { traits } from "@/data/knowledge/traits";
import type { ParsedCodexSignals } from "@/lib/narrativeAssembly/parseSheetSummary";
import type { SectAffinity } from "@/data/knowledge/types";

export type NarrativeEngineContext = {
  clanKey: ClanKnowledgeKey | null;
  clanProfile: (typeof clans)[ClanKnowledgeKey] | null;
  /** Líneas listas para ensamblaje LLM / motor. */
  directiveLines: string[];
  /** Remate corto perceptivo opcional para motor interno. */
  perceptualAccent: string;
  /** Gatillos de disciplinas resueltos desde la ficha CODEX + clan de apoyo cuando falten claves explícitas. */
  disciplineHooks: readonly { key: string; useHint: string; narrativeCue: string }[];
  /** Sellos políticos cuando el perfil existe. */
  sectTones: readonly { sect: SectAffinity; ideology: string; style: string }[];
  traitNudges: string[];
};

/** Texto combinado transfondo + concepto para heurísticas baratas sin NLP. */
function combinedBackground(sig: ParsedCodexSignals): string {
  return `${sig.concepto}\n${sig.transfondo}`.toLowerCase();
}

const EXTENDED_LINAJE_KEYS: readonly { pattern: RegExp; key: ClanKnowledgeKey }[] = [
  { pattern: /\blasombra\b/i, key: "lasombra" },
  { pattern: /\btzimisce\b/i, key: "tzimisce" },
  { pattern: /\bbanu\s+haqim\b/i, key: "banu_haqim" },
  { pattern: /\bministerio\b/i, key: "setite" },
  { pattern: /\bsetite\b/i, key: "setite" },
  { pattern: /\bfollowers?\s+of\s+set\b/i, key: "setite" },
  { pattern: /\bhecata\b/i, key: "other" },
  { pattern: /\bravnos\b/i, key: "other" },
  { pattern: /\bsalubri\b/i, key: "other" },
];

const CLAN_ID_TO_KEY: Record<ClanId, ClanKnowledgeKey> = {
  ventrue: "ventrue",
  nosferatu: "nosferatu",
  brujah: "brujah",
  toreador: "toreador",
  malkavian: "malkavian",
  gangrel: "gangrel",
  tremere: "tremere",
  thin_blood: "thin_blood",
  caitiff: "caitiff",
  other: "other",
};

/** Claves Sereno antes de `:número` en bloque Disciplinas: */
export function parseDisciplineKeysFromLine(line: string): string[] {
  if (!line.trim()) return [];
  const parts = line.split(",");
  const keys: string[] = [];
  for (const p of parts) {
    const token = p.trim().split(/\s*:\s*/)[0]?.trim().toLowerCase();
    if (token) keys.push(token.replace(/\s+/g, "_"));
  }
  return keys;
}

function inferClanKnowledgeKey(sig: ParsedCodexSignals): ClanKnowledgeKey | null {
  const hay = combinedBackground(sig);
  const lin = sig.linajeLine.toLowerCase();
  for (const { pattern, key } of EXTENDED_LINAJE_KEYS) {
    if (pattern.test(lin) || pattern.test(hay)) return key;
  }
  const id = sig.clanGuess;
  return id ? CLAN_ID_TO_KEY[id] : null;
}

function generationNarrative(gen: string): string {
  const g = gen.trim().toLowerCase();
  if (g === "neonato") return blood.generationLabel.neonato;
  if (g === "ancilla") return blood.generationLabel.ancilla;
  return blood.generationLabel.unknown;
}

/** Contexto reusable por `assembleNarrativeWeaveBrief`, sugerencias y futuros resolves de acción. */
export function resolveNarrativeEngineContext(sig: ParsedCodexSignals): NarrativeEngineContext {
  const clanKey = inferClanKnowledgeKey(sig);
  const clanProfile = clanKey ? clans[clanKey] : null;

  const parsedKeys = parseDisciplineKeysFromLine(sig.disciplinesLine);
  const clanDiscFallback = clanProfile?.disciplines?.length ? [...clanProfile.disciplines] : [];
  const keysToExplain =
    parsedKeys.length > 0
      ? parsedKeys
      : clanDiscFallback.length > 0
        ? clanDiscFallback
        : [];

  const disciplineHooks = keysToExplain
    .map((k) => {
      const row = disciplines[k as keyof typeof disciplines];
      if (!row) return null;
      return {
        key: k,
        useHint: row.use,
        narrativeCue: row.narrative[0] ?? row.type,
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const sectTones =
    clanProfile?.sect?.map((s) => ({
      sect: s,
      ideology: sects[s].ideology,
      style: sects[s].style,
    })) ?? [];

  const traitNudges: string[] = [];
  const blob = combinedBackground(sig);
  for (const t of Object.values(traits)) {
    if (t.cues.some((re) => re.test(blob))) traitNudges.push(t.narrativeNudge);
  }

  const directiveLines: string[] = [];

  if (clanProfile) {
    directiveLines.push(
      `Linaje (${clanProfile.name}): identidad dominante «${clanProfile.identity.slice(0, 2).join(" · ")}». Maldición de sangre (tono): ${clanProfile.curse}`,
    );
    directiveLines.push(`Ganchos de escena sugeridos: ${clanProfile.hooks.join(" · ")}.`);
    if (sig.antitribuFlag) {
      directiveLines.push(
        "Marca política probable: antitribu — invertí lealtad de facción por defecto del linaje donde la crónica no lo niegue.",
      );
    }
  } else if (sig.linajeLine.trim()) {
    directiveLines.push(
      `Linaje textual sin perfil extendido cargado («${sig.linajeLine.trim()}») — mantené coherencia crónica antes que manual.`,
    );
  }

  if (sectTones.length) {
    directiveLines.push(
      `Ámbitos políticos asociados: ${sectTones
        .map((x) => `${x.sect} (${x.style})`)
        .join(" · ")} — ideología resumida: ${sectTones[0]!.ideology}`,
    );
  }

  if (disciplineHooks.length) {
    directiveLines.push(
      `Disciplinas motor (traducir a opciones y síntomas, no a manual): ${disciplineHooks
        .map((d) => `${d.key} → ${d.useHint}`)
        .join(" | ")}`,
    );
  }

  directiveLines.push(`Generación (lectura diegética): ${generationNarrative(sig.generacion)}.`);

  if (sig.bloodPotency !== null && sig.bloodPotency !== undefined) {
    const tier =
      sig.bloodPotency >= 3
        ? blood.potencyEffects.slice(0, 3).join(" · ")
        : blood.potencyEffects[0] ?? "";
    directiveLines.push(`Potencia de sangre declarada (${sig.bloodPotency}): ${tier}.`);
  }

  if (traitNudges.length) {
    directiveLines.push(`Capas de transfondo detectadas: ${traitNudges.join(" ")}`);
  }

  const primaryIdentity = clanProfile?.identity[0];
  const primaryDisc = disciplineHooks[0];
  const perceptualAccent = [
    primaryIdentity && `Tu costado ${primaryIdentity} filtra la escena antes que el resto.`,
    primaryDisc && `La disciplina ${primaryDisc.key} insinúa ${primaryDisc.narrativeCue.toLowerCase()}.`,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    clanKey,
    clanProfile,
    directiveLines,
    perceptualAccent,
    disciplineHooks,
    sectTones,
    traitNudges,
  };
}
