import type { ClanId } from "@/lib/character";
import { normalizeStrand, type NarrativeStrand } from "@/lib/narrativeStrands";
import type { NarradorRequestBody } from "@/lib/narrativeTypes";
import { assembleNarrativeWeaveBrief, parseCodexSignalsFromSheetSummary } from "@/lib/narrativeAssembly";
import { weaveKnowledgeIntoActionSuggestions } from "@/lib/narrativeAssembly/actionKnowledge";
import { selectLoreFragments } from "@/lib/narratorKnowledge/selectLore";
import { classifyNexoIntent, type NexoIntent } from "@/lib/internal-engine/classifyIntent";
import { DictionaryManager } from "@/lib/internal-engine/dictionaryManager";
import { applyFriction, compressBeastProse, type FrictionProfile } from "@/lib/internal-engine/friction";
import { buildSigmaSystemWhispers } from "@/lib/internal-engine/sigmaWhispers";

export type NexoInternalV1Payload = {
  /** Amenaza inquisitorial 0–5 reflejada en JSON extendido. */
  sigmaTier: number;
  /** Mensajes rol `sistema` — paranoia / glitch SchreckNet. */
  systemWhispers: string[];
};

export type InternalNarradorEngineResult = {
  narracion: string;
  resumen_actualizado?: string;
  sugerencias?: string[];
  /** Solo motor interno Nexo v1 — el cliente puede renderizar `sistema` aparte. */
  nexoInternalV1?: NexoInternalV1Payload;
};

function clip(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function stableHash(parts: string[]): number {
  const s = parts.filter(Boolean).join("|");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function chronicleFingerprint(c?: NarradorRequestBody["chronicle"]): string {
  if (!c) return "";
  return [c.AMBIENTE, c.TENSION, c.ESTADO_GLOBAL, c.foundations, c.VINCULO_HILOS]
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .join("·")
    .slice(0, 400);
}

const PLAYER_BEATS_COMMON: readonly string[] = [
  "Cuento tres respiraciones y vuelvo a mirar antes de moverme otro metro.",
  "Afino los hombros; el silencio en la calle pesa igual que cualquier insulto.",
  "Dejo pasar dos figuras antes de ocupar yo el hueco donde no quiero ser visto.",
];

const PLAYER_BEATS: Record<
  ReturnType<typeof classifyNexoIntent>,
  readonly string[]
> = {
  greeting: ["Asiento la gorra y mido quién mueve la barbilla primero."],
  survival_probe: ["Priorizo pan barato antes de favores caros.", "Sigo olor a fritanga que promete testigos de carne."],
  localization: ["Me guío por el zumbido del transformador del cruce fijo."],
  examine: ["Fijo dedos en una mota que no debería estar ahí.", "Leo etiquetas borradas en un envase demasiado limpio."],
  move: ["Cambio acera cuando el farol parpadea dos veces seguidas.", "Entro después de otro peatón hasta confundir pisadas."],
  social: ["Mantengo la sonrisa un milímetro más de lo que el otro aguanta.", "Hablo bajito y obligo a inclinarse."],
  violence: ["Cierro el radio del codo hasta que el aire chirríe.", "Ralentizo el gesto por si alguien graba."],
  flee: ["Elijo la bajada con olor a orina vieja porque nadie mira con ganas.", "Subo a bus equivocado y bajo dos paradas después."],
  magic: ["Olor a ozono breve; finjo estornudar para encubrirlo.", "Amplifico un detalle visual hasta que el otro parpadea tarde."],
  ambient: ["Sigo el olor a churrasco quemado en un ventilador roto.", "Toco metal oxidado hasta que el dolor ordena pensamiento."],
};

function uniqueLines(xs: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of xs) {
    const t = raw.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function pickThreeActionLines(primary: readonly string[], h: number, common: readonly string[]): string[] {
  const cand = uniqueLines([...primary, ...common]);
  if (cand.length === 0) return [];
  const n = cand.length;
  if (n === 1) return [clip(cand[0]!, 118)];
  let step = 1 + (Math.abs(h >> 5) % (n > 2 ? n - 1 : 1));
  if (step >= n) step = Math.max(1, n - 1) || 1;
  let i = Math.abs(h * 7919) % n;
  const picks: string[] = [];
  for (let tries = 0; tries < n * 4 && picks.length < 3; tries += 1) {
    const line = cand[i % n]!;
    const clipped = clip(line, 118);
    if (!picks.includes(clipped)) picks.push(clipped);
    i += step;
  }
  while (picks.length < 3 && picks.length < n) {
    const line = cand[picks.length % n]!;
    const clipped = clip(line, 118);
    if (!picks.includes(clipped)) picks.push(clipped);
  }
  return picks.slice(0, 3);
}

/** Solo salida motor interno: tokens `[[GLYPH:…]]` con lista blanca; el cliente los parsea a React. */
function injectInternalGlyphTokens(
  narracion: string,
  ctx: { sigma: number; hambre: number; intent: NexoIntent },
): string {
  const t = narracion.trimEnd();
  if (!t) return narracion;
  const tags: string[] = [];
  if (ctx.sigma >= 4) tags.push("[[GLYPH:inquisition]]");
  if (ctx.hambre >= 4 || (ctx.intent === "violence" && ctx.hambre >= 3)) tags.push("[[GLYPH:blood]]");
  if (tags.length === 0) return narracion;
  return `${t}\n\n${tags.join(" ")}`;
}

export function generateInternalNexoNarration(body: NarradorRequestBody): InternalNarradorEngineResult {
  const strand: NarrativeStrand = normalizeStrand(body.narrativeStrand);
  const intent = classifyNexoIntent(body.playerAction);
  const disrupt = body.synapticDisruption?.trim();
  const weave = assembleNarrativeWeaveBrief(body);
  const codex = parseCodexSignalsFromSheetSummary(body.sheetSummary ?? "");
  const clanId: ClanId | null = codex.clanGuess;
  const hambre = codex.hunger ?? 0;
  const sigma = Math.max(0, Math.min(5, Math.round(body.inquisitionThreat)));

  const hBase = stableHash([
    strand,
    body.playerAction.trim().slice(0, 520),
    body.sheetSummary?.slice?.(0, 400) ?? "",
    chronicleFingerprint(body.chronicle),
    (body.rollingSummary ?? "").slice(0, 200),
    (body.worldNexusContext ?? "").slice(0, 320),
    weave.stableSeedParts.join("·"),
    ...(body.recentLogs?.slice(-4).map((l) => l.text.slice(0, 80)) ?? []),
  ]);

  const profile = { clanId, hambre, sigma };

  const prefijo = DictionaryManager.prefijoAmbiente(intent, profile, hBase);
  const accion = DictionaryManager.accionProcesada(intent, profile, body.playerAction, hBase + 1);
  const filtro = DictionaryManager.filtroClan(clanId, hBase + 2);
  const consecuencia = DictionaryManager.consecuenciaEstado(sigma, hBase + 4);

  let coreNarracion = [prefijo, accion, filtro, consecuencia].join("\n\n").trim();

  const loreBits = selectLoreFragments({
    narrativeStrand: strand,
    inquisitionThreat: body.inquisitionThreat,
    sheetSummary: body.sheetSummary,
    chronicle: body.chronicle,
    playerAction: body.playerAction,
    rollingSummary: body.rollingSummary,
    worldNexusContext: body.worldNexusContext,
  });
  const loreBlock = loreBits.length ? `\n\n${loreBits.join("\n")}` : "";

  const weaveBlock = weave.internalSceneFragment.trim() ? `\n\n${weave.internalSceneFragment.trim()}` : "";

  const disruptBlock = disrupt ? `\n\nDisrupción activa — ${disrupt.slice(0, 900)}` : "";

  coreNarracion = `${coreNarracion}${loreBlock}${weaveBlock}${disruptBlock}`.trim();

  const frictionProfile: FrictionProfile = {
    clanId,
    healthDamage: codex.healthDamage ?? 0,
    humanidad: codex.humanity,
    hambre,
    sigma,
    seed: hBase,
  };

  let narracion = applyFriction(coreNarracion, frictionProfile);
  narracion = compressBeastProse(narracion, hambre, hBase);
  narracion = injectInternalGlyphTokens(narracion, { sigma, hambre, intent });

  const sugerencias = weaveKnowledgeIntoActionSuggestions(
    codex,
    pickThreeActionLines(PLAYER_BEATS[intent], hBase, PLAYER_BEATS_COMMON),
    hBase,
  );

  const rawWhispers = buildSigmaSystemWhispers(sigma, hBase);
  const systemWhispers = rawWhispers.map((w) => applyFriction(w, { ...frictionProfile, seed: frictionProfile.seed + w.length }));

  const resumen_actualizado = clip(
    `${clip(body.playerAction, 120)} · ${intent} · σ${sigma} · hambre${hambre}`,
    300,
  );

  return {
    narracion,
    resumen_actualizado,
    sugerencias,
    nexoInternalV1:
      systemWhispers.length > 0
        ? {
            sigmaTier: sigma,
            systemWhispers,
          }
        : undefined,
  };
}

/** Alias estable para el pipeline `runNarrador`. */
export function generateInternalNarrador(body: NarradorRequestBody): InternalNarradorEngineResult {
  return generateInternalNexoNarration(body);
}
