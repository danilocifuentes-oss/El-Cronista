import type { LlmDriverId } from "./config";

const WINDOW_MS = 8 * 60 * 1000;
const MAX_FAILS_IN_WINDOW = 4;

const failTimes: Partial<Record<"gemini" | "openai", number[]>> = {};

function prune(id: "gemini" | "openai", now: number): number[] {
  const arr = (failTimes[id] ?? []).filter((t) => now - t < WINDOW_MS);
  failTimes[id] = arr;
  return arr;
}

/** Tras error de red o salida rechazada. */
export function recordExternalDriverFailure(id: "gemini" | "openai"): void {
  const now = Date.now();
  const arr = prune(id, now);
  arr.push(now);
  failTimes[id] = arr;
}

/** Tras una respuesta aceptada por el guardián. */
export function recordExternalDriverSuccess(id: "gemini" | "openai"): void {
  failTimes[id] = [];
}

/** Si true, se omite el driver un tiempo para no martillar APIs rotas. */
export function isExternalDriverCooling(id: "gemini" | "openai"): boolean {
  return prune(id, Date.now()).length >= MAX_FAILS_IN_WINDOW;
}

export function applyDriverCircuitToChain(chain: readonly LlmDriverId[]): LlmDriverId[] {
  return chain.filter((d) => d === "internal" || !isExternalDriverCooling(d));
}

export function getLlmCircuitDiagnostics(): {
  geminiFailuresInWindow: number;
  openaiFailuresInWindow: number;
  geminiCooling: boolean;
  openaiCooling: boolean;
} {
  const now = Date.now();
  const g = prune("gemini", now).length;
  const o = prune("openai", now).length;
  return {
    geminiFailuresInWindow: g,
    openaiFailuresInWindow: o,
    geminiCooling: g >= MAX_FAILS_IN_WINDOW,
    openaiCooling: o >= MAX_FAILS_IN_WINDOW,
  };
}
