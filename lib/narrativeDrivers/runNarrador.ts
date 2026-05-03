import type { NarradorRequestBody } from "@/lib/narrativeTypes";

import { resolveDriverChain, type LlmDriverId } from "./config";
import { generateNarradorWithGemini } from "./geminiNarrador";
import { generateInternalNarrador } from "./internalNarrador";
import { generateNarradorWithOpenAi } from "./openAiNarrador";
import { buildNarradorUserPrompt } from "./prompts";

export type NarradorSuccess = {
  narration: string;
  rollingSummary?: string;
  /** Solo diagnóstico en logs servidor; no se envía al cliente. */
  driverUsed?: LlmDriverId;
};

/**
 * Cadena de drivers según env (Gemini → OpenAI → interno por defecto si hay fallos).
 * El motor interno no lanza: siempre hay respuesta usable.
 */
export async function executeNarradorPipeline(body: NarradorRequestBody): Promise<NarradorSuccess> {
  const userPrompt = buildNarradorUserPrompt(body);
  const chain = resolveDriverChain();
  let lastErr: unknown;

  for (const driver of chain) {
    try {
      if (driver === "gemini") {
        const r = await generateNarradorWithGemini(userPrompt);
        return {
          narration: r.narracion,
          rollingSummary: r.resumen_actualizado,
          driverUsed: "gemini",
        };
      }
      if (driver === "openai") {
        const r = await generateNarradorWithOpenAi(userPrompt);
        return {
          narration: r.narracion,
          rollingSummary: r.resumen_actualizado,
          driverUsed: "openai",
        };
      }
      const r = generateInternalNarrador(body);
      return {
        narration: r.narracion,
        rollingSummary: r.resumen_actualizado,
        driverUsed: "internal",
      };
    } catch (e) {
      lastErr = e;
      console.warn("[executeNarradorPipeline] driver falló:", driver, e);
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr ?? "Narrador sin respuesta."));
}
