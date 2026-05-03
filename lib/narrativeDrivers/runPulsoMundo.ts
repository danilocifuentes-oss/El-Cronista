import { GoogleGenerativeAI } from "@google/generative-ai";

import { resolveGeminiApiKey } from "@/lib/geminiEnv";
import { isQuotaOrRateLimitError, resolveGeminiModels, withExponentialBackoff } from "@/lib/geminiRetry";
import { getOperatorSeedBlock, isExternalLlmBlocked } from "@/lib/operatorRuntimeSettings";

import { openAiModel } from "./config";

function parseLines(text: string): string[] {
  const trimmed = text.trim();
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((x) => (typeof x === "string" ? x.trim().slice(0, 160) : ""))
        .filter(Boolean)
        .slice(0, 6);
    }
  } catch {
    /* seguir */
  }
  return [];
}

function hashHint(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Cuando no hay APIs externas o fallan todas — líneas coherentes con semilla del operador. */
export function internalPulsoLines(ciudadHint: string): string[] {
  const seed = getOperatorSeedBlock().slice(0, 600);
  const hint = ciudadHint.trim().slice(0, 120);
  const base = `${seed}|${hint}`;
  const h = hashHint(base);
  const pool = [
    `Sector ${hint || "central"}: sensores municipales fallan en bandas nocturnas; nadie asume culpa.`,
    "Radio comunitaria: 'Si ves sombras que caminan derechas, no filmes.'",
    "Humo industrial mezclado con olor a ozono — rumor de disciplina mal contenida cerca del río.",
    "Pega viral: 'Busco roomie. No vampiros.' Firma: alguien que sabe demasiado.",
    "Ruta intermodal con retraso fantasma: los GPS dicen una cosa y el asfalto, otra.",
    "Cámara de seguridad borrosa: figura con gabardina y dos sombras de más.",
    "Minimarket 24h: cambian el café; el encargado murmura sobre 'clientes que no calientan'.",
  ];
  const out: string[] = [];
  for (let i = 0; i < 4; i += 1) {
    out.push(pool[(h + i * 3) % pool.length]);
  }
  if (seed) {
    const clip = seed.split(/\n/).filter(Boolean)[0]?.slice(0, 140) ?? seed.slice(0, 140);
    out[0] = `Eco de campaña: ${clip}`;
  }
  return out;
}

function buildPrompt(ciudadHint: string): string {
  const seed = getOperatorSeedBlock().trim();
  return [
    "Santiago de Chile, tono Mundo de Tinieblas / ciudad gótica contemporánea.",
    "Devuelve SOLO un JSON array de exactamente 4 strings en español (Chile).",
    "Cada string ≤ 120 caracteres: mezcla de clima anómalo, aviso sospechoso, rumor, infraestructura.",
    ciudadHint ? `Barrio / zona sugerida: ${ciudadHint}` : "",
    seed ? `Continuidad de campaña (intenta no contradecir tono): ${seed.slice(0, 900)}` : "",
    "Sin markdown; solo el array JSON.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function pulsoGemini(ciudadHint: string): Promise<string[]> {
  const key = resolveGeminiApiKey();
  if (!key) throw new Error("sin gemini");
  const ai = new GoogleGenerativeAI(key);
  const { primary, fallback } = resolveGeminiModels();
  const prompt = buildPrompt(ciudadHint);

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

  const lines = parseLines(raw);
  if (lines.length >= 2) return lines;
  throw new Error("pulso gemini insuficiente");
}

async function pulsoOpenAi(ciudadHint: string): Promise<string[]> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("sin openai");
  const prompt = buildPrompt(ciudadHint);
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: openAiModel(),
      temperature: 0.85,
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Devuelve JSON con clave "lines": array de exactamente 4 strings (noticias diegéticas).',
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text.slice(0, 400));
  const data = JSON.parse(text) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("openai vacío");
  const j = JSON.parse(content) as { lines?: unknown };
  if (Array.isArray(j.lines)) {
    const lines = j.lines
      .map((x) => (typeof x === "string" ? x.trim().slice(0, 160) : ""))
      .filter(Boolean)
      .slice(0, 6);
    if (lines.length >= 2) return lines;
  }
  throw new Error("openai formato");
}

/**
 * Misma filosofía que narrador/cronista: respeta bloqueo de APIs externas;
 * si hay claves, intenta Gemini → OpenAI → plantillas internas.
 */
export async function executePulsoMundo(ciudadHint: string): Promise<string[]> {
  if (isExternalLlmBlocked()) {
    return internalPulsoLines(ciudadHint);
  }

  try {
    return await pulsoGemini(ciudadHint);
  } catch {
    /* siguiente */
  }

  try {
    return await pulsoOpenAi(ciudadHint);
  } catch {
    /* siguiente */
  }

  return internalPulsoLines(ciudadHint);
}
