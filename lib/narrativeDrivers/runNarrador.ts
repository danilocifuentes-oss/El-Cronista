import type { NarradorRequestBody, NarradorRollPrompt } from "@/lib/narrativeTypes";
import { inferRollPrompt } from "@/lib/narrativeRollHint";
import { isNarratorChannelPaused } from "@/lib/operatorRuntimeSettings";

import { formatOrchestrationForPrompt, orchestrateChannelTurn } from "@/lib/gameWorld";

import { resolveDriverChain, type LlmDriverId } from "./config";
import { generateNarradorWithGemini } from "./geminiNarrador";
import { generateInternalNarrador } from "./internalNarrador";
import { generateNarradorWithOpenAi } from "./openAiNarrador";
import { buildNarradorUserPrompt } from "./prompts";

export type NarradorSuccess = {
  narration: string;
  rollingSummary?: string;
  suggestions?: string[];
  rollPrompt?: NarradorRollPrompt;
  /** Solo diagnóstico en logs servidor; no se envía al cliente. */
  driverUsed?: LlmDriverId;
};

/**
 * Cadena de drivers según env (Gemini → OpenAI → interno por defecto si hay fallos).
 * El motor interno no lanza: siempre hay respuesta usable.
 */
export async function executeNarradorPipeline(body: NarradorRequestBody): Promise<NarradorSuccess> {
  if (isNarratorChannelPaused()) {
    throw new Error("OPERATOR_CHANNEL_PAUSED");
  }
  const worldOrch = await orchestrateChannelTurn({
    inquisitionThreat: body.inquisitionThreat,
    actionSummary: body.playerAction.slice(0, 220),
    tag: body.narrativeStrand ?? "principal",
    npcMemoryKey: body.orchestrationNpcKey,
  });
  const orchText = formatOrchestrationForPrompt(worldOrch);
  const userPrompt = buildNarradorUserPrompt(body, orchText);
  const chain = resolveDriverChain();
  let lastErr: unknown;
  const rollPrompt = inferRollPrompt(body);

  for (const driver of chain) {
    try {
      if (driver === "gemini") {
        const r = await generateNarradorWithGemini(userPrompt);
        return {
          narration: r.narracion,
          rollingSummary: r.resumen_actualizado,
          suggestions: r.sugerencias,
          rollPrompt,
          driverUsed: "gemini",
        };
      }
      if (driver === "openai") {
        const r = await generateNarradorWithOpenAi(userPrompt);
        return {
          narration: r.narracion,
          rollingSummary: r.resumen_actualizado,
          suggestions: r.sugerencias,
          rollPrompt,
          driverUsed: "openai",
        };
      }
      const r = generateInternalNarrador(body);
      return {
        narration: r.narracion,
        rollingSummary: r.resumen_actualizado,
        suggestions: r.sugerencias,
        rollPrompt,
        driverUsed: "internal",
      };
    } catch (e) {
      lastErr = e;
      console.warn("[executeNarradorPipeline] driver falló:", driver, e);
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr ?? "Narrador sin respuesta."));
}
