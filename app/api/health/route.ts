import { NextResponse } from "next/server";

import { isGeminiConfigured, whichGeminiEnvName } from "@/lib/geminiEnv";
import { describeDriverResolution, hasOpenAiKey } from "@/lib/narrativeDrivers/config";
import { applyDriverCircuitToChain, getLlmCircuitDiagnostics } from "@/lib/narrativeDrivers/llmCircuitBreaker";
import {
  getOperatorRuntimeState,
  isExternalLlmBlocked,
  isNarratorChannelPaused,
} from "@/lib/operatorRuntimeSettings";

export const runtime = "nodejs";

function isUpstashRedisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim());
}

/**
 * GET /api/health
 * Por defecto: cuerpo mínimo (operaciones / monitoreo) sin mapas de endpoints ni claves de operador.
 * Diagnóstico extendido sólo con `NEXO_HEALTH_DIAGNOSTICS=1` en el servidor (p. ej. entorno de desarrollo).
 */
export async function GET() {
  const geminiConfigured = isGeminiConfigured();
  const geminiEnvNameUsed = whichGeminiEnvName();
  const op = getOperatorRuntimeState();

  const minimal = {
    ok: true as const,
    clientResetEpoch: typeof op.clientResetEpoch === "number" ? op.clientResetEpoch : 0,
    service: "el-cronista-de-las-sombras",
    geminiConfigured,
    openAiKeyPresent: hasOpenAiKey(),
    redisConfigured: isUpstashRedisConfigured(),
    channelPaused: isNarratorChannelPaused(),
    externalLlmBlocked: isExternalLlmBlocked(),
  };

  if (process.env.NEXO_HEALTH_DIAGNOSTICS !== "1") {
    return NextResponse.json(minimal);
  }

  const driver = describeDriverResolution();
  const llmCircuit = getLlmCircuitDiagnostics();

  return NextResponse.json({
    ...minimal,
    geminiEnvNameUsed,
    narrativeDriverChain: driver.chain,
    narrativeDriverChainEffective: applyDriverCircuitToChain(driver.chain),
    llmCircuit,
    operatorRuntime: {
      channelPausedEffective: isNarratorChannelPaused(),
      externalLlmBlockedEffective: isExternalLlmBlocked(),
      seedContextChars: op.seedContext.trim().length,
      settingsAgeMs: op.updatedAt ? Date.now() - op.updatedAt : null,
    },
    operatorEnvHints: {
      NEXO_FORCE_INTERNAL_ONLY: "1 fuerza sólo motor de sala (sin canal remoto al núcleo).",
      NEXO_CHANNEL_PAUSED: "1 pausa canal jugador.",
      UPSTASH_REDIS: "URL + token — campaña multijugador y orquestación persistente (servidor).",
      NEXO_ORCH_DISK: "1 opcional self-hosted: JSON local además de Redis.",
    },
    note: "Variables de clave y modelo se definen sólo en el servidor; no se incluyen valores en esta respuesta.",
  });
}
