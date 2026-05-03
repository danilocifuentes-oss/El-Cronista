import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  SchemaType,
} from "@google/generative-ai";

import { resolveGeminiApiKey } from "@/lib/geminiEnv";
import { isQuotaOrRateLimitError, resolveGeminiModels, withExponentialBackoff } from "@/lib/geminiRetry";

import { CRONISTA_SYSTEM } from "./prompts";

const SAFETY_FIX = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

export async function streamCronistaGemini(userPrompt: string) {
  const key = resolveGeminiApiKey();
  if (!key) throw new Error("GEMINI_API_KEY no configurada.");
  const genAI = new GoogleGenerativeAI(key);
  const { primary, fallback } = resolveGeminiModels();

  async function streamGenerate(modelName: string) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: `${CRONISTA_SYSTEM}\n\n(Responde en texto plano continuo, sin JSON ni markdown de bloque.)`,
      safetySettings: SAFETY_FIX,
      generationConfig: {
        temperature: 0.84,
        maxOutputTokens: 1536,
      },
    });
    return model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    });
  }

  try {
    try {
      const streamResult = await withExponentialBackoff(() => streamGenerate(primary), {
        maxAttempts: 2,
        baseDelayMs: 1200,
        label: primary,
        capWaitMs: 10_000,
      });
      return streamResult.stream;
    } catch (e1) {
      if (!isQuotaOrRateLimitError(e1) || primary === fallback) throw e1;
      console.warn("[geminiCronista stream] fallback →", fallback);
      const streamResult = await withExponentialBackoff(() => streamGenerate(fallback), {
        maxAttempts: 2,
        baseDelayMs: 1200,
        label: fallback,
        capWaitMs: 10_000,
      });
      return streamResult.stream;
    }
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
}

export async function jsonCronistaGemini(userPrompt: string): Promise<string> {
  const key = resolveGeminiApiKey();
  if (!key) throw new Error("GEMINI_API_KEY no configurada.");
  const genAI = new GoogleGenerativeAI(key);
  const { primary, fallback } = resolveGeminiModels();

  async function jsonGenerate(modelName: string) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: CRONISTA_SYSTEM,
      safetySettings: SAFETY_FIX,
      generationConfig: {
        temperature: 0.84,
        maxOutputTokens: 1536,
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            narracion: {
              type: SchemaType.STRING,
              description: "Consecuencias narrativas de la tirada, tono Cronista.",
            },
          },
          required: ["narracion"],
        },
      },
    });
    return model.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    });
  }

  try {
    try {
      const result = await withExponentialBackoff(() => jsonGenerate(primary), {
        maxAttempts: 2,
        baseDelayMs: 1200,
        label: primary,
        capWaitMs: 10_000,
      });
      return result.response.text().trim();
    } catch (e1) {
      if (!isQuotaOrRateLimitError(e1) || primary === fallback) throw e1;
      console.warn("[geminiCronista json] fallback →", fallback);
      const result = await withExponentialBackoff(() => jsonGenerate(fallback), {
        maxAttempts: 2,
        baseDelayMs: 1200,
        label: fallback,
        capWaitMs: 10_000,
      });
      return result.response.text().trim();
    }
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
}
