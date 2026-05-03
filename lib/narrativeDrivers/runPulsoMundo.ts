import { GoogleGenerativeAI } from "@google/generative-ai";

import { resolveGeminiApiKey } from "@/lib/geminiEnv";
import { isQuotaOrRateLimitError, resolveGeminiModels, withExponentialBackoff } from "@/lib/geminiRetry";
import { tryOpenAiClient } from "@/lib/openAiClient";
import { getOperatorSeedBlock, isExternalLlmBlocked } from "@/lib/operatorRuntimeSettings";

import { openAiModel } from "./config";

/** Eco banal / ciudad vs eco vampírico / místico para la bitácora dual. */
export type PulsoMundoDual = {
  ecoVisible: string[];
  ecoSombras: string[];
};

function clampLines(arr: unknown, maxLines: number, maxLen: number): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => (typeof x === "string" ? x.trim().slice(0, maxLen) : ""))
    .filter(Boolean)
    .slice(0, maxLines);
}

function parseDualFromText(raw: string): PulsoMundoDual | null {
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    const v = clampLines(parsed.eco_visible ?? parsed.ecoVisible ?? parsed.ciudad, 4, 160);
    const s = clampLines(parsed.eco_sombras ?? parsed.ecoSombras ?? parsed.sombras, 4, 160);
    if (v.length >= 1 && s.length >= 1) return { ecoVisible: v.slice(0, 4), ecoSombras: s.slice(0, 4) };
    if (Array.isArray(parsed.lines)) {
      const lines = clampLines(parsed.lines, 8, 160);
      if (lines.length >= 4) {
        return { ecoVisible: lines.slice(0, 4), ecoSombras: lines.slice(0, 4) };
      }
    }
  } catch {
    /* seguir */
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      const lines = clampLines(parsed, 8, 160);
      if (lines.length >= 4)
        return { ecoVisible: lines.slice(0, Math.ceil(lines.length / 2)), ecoSombras: lines.slice(Math.ceil(lines.length / 2)) };
    }
  } catch {
    /* */
  }
  return null;
}

function hashHint(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const POOL_CIUDAD = [
  "Municipio anuncia corte mapuche de agua desde las 02:00; vecinos cargan bidones antes del toque de queda blando.",
  "Radio FM: conductor furioso protagoniza video viral en Costanera; nadie menciona los tres segundos de silencio en el clip.",
  "Subtes con retraso por 'operativo conjunto'; app del Metro muestra llegada fantasiosa.",
  "Feria Libre: rumor de intoxicaciones leves; Salud Municipal calma con versión oficial de 'virus estacional'.",
  "Lluvias finas; paraguas improvisados inundan plaza; un candidato reaparece sólo como afiche mojado.",
];

const POOL_SOMBRAS = [
  "Olor a hierro viejo pegado al asfalto recién lavado por lluvia; los perros evitan esa vereda desde hace noches.",
  "Luz de seguridad titila tres veces y se cumple un minuto antes de cualquier sirena cercana.",
  "Pegatinas ilegibles en poste: símbolo que nadie etiqueta bien en redes, pero algunos influencers dejaron de subir selfies ahí.",
  "Taxi cuenta que el pasajero anterior no apareció en ninguna lectora térmica; el taxímetro igual cobró la carrera.",
  "Humo violeta apenas visible en tragaluz abandonado — reflejo residual, dicen.",
];

/** Plantilla dual cuando no hay LLM externo. */
export function internalPulsoDual(ciudadHint: string): PulsoMundoDual {
  const seed = getOperatorSeedBlock().slice(0, 600);
  const hint = ciudadHint.trim().slice(0, 120);
  const h = hashHint(`${seed}|${hint}|dual`);
  const ecoVisible: string[] = [];
  const ecoSombras: string[] = [];
  for (let i = 0; i < 4; i += 1) {
    ecoVisible.push(POOL_CIUDAD[(h + i * 2) % POOL_CIUDAD.length]);
    ecoSombras.push(POOL_SOMBRAS[(h + i * 2 + 1) % POOL_SOMBRAS.length]);
  }
  if (seed) {
    const clip = seed.split(/\n/).filter(Boolean)[0]?.slice(0, 120) ?? seed.slice(0, 120);
    ecoSombras[0] = `Susurro entre linajes (eco de mesa): ${clip}`;
  }
  if (hint) {
    ecoVisible[0] = `Zona sugerida «${hint}»: ${ecoVisible[0]}`;
  }
  return { ecoVisible, ecoSombras };
}

function buildPromptDual(ciudadHint: string): string {
  const seed = getOperatorSeedBlock().trim();
  return [
    "Santiago de Chile, tono Mundo de Tinieblas / ciudad contemporánea gótico-punk.",
    "Devuelve SOLO un JSON objeto (sin markdown) con:",
    '- "eco_visible": array de exactamente 4 strings en español (Chile): noticias BANALES o mortales que circulan en ciudad (política mortal, meteorología urbana, tráfico, apps, infra). Sin vampiros explícitos.',
    '- "eco_sombras": array de exactamente 4 strings: rumores místicos, paranoia vampírica, política vampírica, presencias indebidas.',
    "Cada string ≤ 118 caracteres.",
    ciudadHint ? `Barrio / zona opcional para anclar: ${ciudadHint}` : "",
    seed ? `No contradigas tono general: ${seed.slice(0, 800)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function pulsoGeminiDual(ciudadHint: string): Promise<PulsoMundoDual> {
  const key = resolveGeminiApiKey();
  if (!key) throw new Error("sin gemini");
  const ai = new GoogleGenerativeAI(key);
  const { primary, fallback } = resolveGeminiModels();
  const prompt = buildPromptDual(ciudadHint);

  let raw: string;
  try {
    raw = await withExponentialBackoff(
      async () => {
        const model = ai.getGenerativeModel({ model: primary });
        const out = await model.generateContent(prompt);
        return out.response.text();
      },
      { maxAttempts: 2, baseDelayMs: 900, label: "pulso-gemini", capWaitMs: 8000 },
    );
  } catch (e1) {
    if (!isQuotaOrRateLimitError(e1) || primary === fallback) throw e1;
    raw = await withExponentialBackoff(
      async () => {
        const model = ai.getGenerativeModel({ model: fallback });
        const out = await model.generateContent(prompt);
        return out.response.text();
      },
      { maxAttempts: 2, baseDelayMs: 900, label: "pulso-gemini-fb", capWaitMs: 8000 },
    );
  }

  const dual = parseDualFromText(raw);
  if (dual && dual.ecoVisible.length >= 2 && dual.ecoSombras.length >= 2) return dual;
  throw new Error("pulso gemini insuficiente");
}

async function pulsoOpenAiDual(ciudadHint: string): Promise<PulsoMundoDual> {
  const openai = tryOpenAiClient();
  if (!openai) throw new Error("sin openai");
  const completion = await openai.chat.completions.create({
    model: openAiModel(),
    temperature: 0.85,
    max_tokens: 950,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          'Responde JSON con eco_visible y eco_sombras, cada uno array de 4 strings cortos.',
      },
      { role: "user", content: buildPromptDual(ciudadHint) },
    ],
  });
  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("openai vacío");
  const dual = parseDualFromText(content);
  if (dual && dual.ecoVisible.length >= 2 && dual.ecoSombras.length >= 2) return dual;
  throw new Error("openai formato");
}

/**
 * Bitácora pública dual: ciudad visible vs sombras; respeta APIs externas.
 */
export async function executePulsoMundo(ciudadHint: string): Promise<PulsoMundoDual> {
  if (isExternalLlmBlocked()) {
    return internalPulsoDual(ciudadHint);
  }

  try {
    return await pulsoGeminiDual(ciudadHint);
  } catch {
    /* siguiente */
  }

  try {
    return await pulsoOpenAiDual(ciudadHint);
  } catch {
    /* siguiente */
  }

  return internalPulsoDual(ciudadHint);
}
