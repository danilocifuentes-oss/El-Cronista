import type { NarradorRequestBody, NarradorRollPrompt, NexoInternalV1ApiPayload } from "@/lib/narrativeTypes";
import { inferRollPrompt } from "@/lib/narrativeRollHint";
import { isNarratorChannelPaused } from "@/lib/operatorRuntimeSettings";
import { sanitizePlayerFacingNarration, sanitizeSuggestionLine } from "@/lib/playerFacingText";

import { formatOrchestrationForPrompt, orchestrateChannelTurn } from "@/lib/gameWorld";

import { applyDriverCircuitToChain, recordExternalDriverFailure, recordExternalDriverSuccess } from "./llmCircuitBreaker";
import { acceptNarradorOutput } from "./llmOutputAcceptance";
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
  /** Motor interno Nexo v1 — susurros `sistema` en cliente. */
  nexoInternalV1?: NexoInternalV1ApiPayload;
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
  const chain = applyDriverCircuitToChain(resolveDriverChain());
  let lastErr: unknown;
  const rollPrompt = inferRollPrompt(body);

  for (const driver of chain) {
    try {
      if (driver === "gemini") {
        const r = await generateNarradorWithGemini(userPrompt);
        const narration = sanitizePlayerFacingNarration(r.narracion);
        const rollingSummary =
          typeof r.resumen_actualizado === "string" ? r.resumen_actualizado.trim().slice(0, 2000) : undefined;
        const suggestions = r.sugerencias?.map(sanitizeSuggestionLine);
        const gate = acceptNarradorOutput(narration, { rollingSummary, suggestions });
        if (!gate.ok) {
          recordExternalDriverFailure("gemini");
          lastErr = new Error(`Gemini · salida no aceptada (${gate.reason})`);
          console.warn("[executeNarradorPipeline]", gate.reason);
          continue;
        }
        recordExternalDriverSuccess("gemini");
        return {
          narration,
          rollingSummary,
          suggestions,
          rollPrompt,
          driverUsed: "gemini",
        };
      }
      if (driver === "openai") {
        const r = await generateNarradorWithOpenAi(userPrompt);
        const narration = sanitizePlayerFacingNarration(r.narracion);
        const rollingSummary =
          typeof r.resumen_actualizado === "string" ? r.resumen_actualizado.trim().slice(0, 2000) : undefined;
        const suggestions = r.sugerencias?.map(sanitizeSuggestionLine);
        const gate = acceptNarradorOutput(narration, { rollingSummary, suggestions });
        if (!gate.ok) {
          recordExternalDriverFailure("openai");
          lastErr = new Error(`OpenAI · salida no aceptada (${gate.reason})`);
          console.warn("[executeNarradorPipeline]", gate.reason);
          continue;
        }
        recordExternalDriverSuccess("openai");
        return {
          narration,
          rollingSummary,
          suggestions,
          rollPrompt,
          driverUsed: "openai",
        };
      }
      const r = generateInternalNarrador(body);
      return {
        narration: sanitizePlayerFacingNarration(r.narracion),
        rollingSummary: r.resumen_actualizado,
        suggestions: r.sugerencias?.map(sanitizeSuggestionLine),
        rollPrompt,
        driverUsed: "internal",
        ...(r.nexoInternalV1
          ? {
              nexoInternalV1: {
                sigmaTier: r.nexoInternalV1.sigmaTier,
                systemWhispers: r.nexoInternalV1.systemWhispers.map((w) =>
                  sanitizePlayerFacingNarration(w),
                ),
              },
            }
          : {}),
      };
    } catch (e) {
      lastErr = e;
      if (driver === "gemini" || driver === "openai") recordExternalDriverFailure(driver);
      console.warn("[executeNarradorPipeline] driver falló:", driver, e);
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr ?? "Narrador sin respuesta."));
}
