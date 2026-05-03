import { parseFetchJson } from "@/lib/parseFetchJson";
import type { NarradorApiResponse, NarradorRequestBody, NexoInternalV1ApiPayload } from "@/lib/narrativeTypes";

/**
 * Llama al narrador Gemini vía `/api/narrador` (clave solo en servidor).
 */
export async function askCronista(body: NarradorRequestBody): Promise<NarradorApiResponse> {
  const res = await fetch("/api/narrador", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await parseFetchJson<
    NarradorApiResponse & {
      error?: string;
      raw?: string;
      rollPrompt?: { nivel?: string; enfoque?: string };
      nexoInternalV1?: NexoInternalV1ApiPayload;
    }
  >(res);

  if (!res.ok) {
    throw new Error(data.error || `narrador HTTP ${res.status}`);
  }

  if (!data.narration?.trim()) {
    throw new Error(data.error || "Respuesta sin narración.");
  }

  const rp = data.rollPrompt;
  let rollPrompt: NarradorApiResponse["rollPrompt"];
  if (rp && typeof rp === "object" && typeof rp.enfoque === "string") {
    const n = rp.nivel;
    if (n === "opcional" || n === "recomendada" || n === "urgente") {
      rollPrompt = { nivel: n, enfoque: rp.enfoque.trim() };
    }
  }

  const sugRaw =
    Array.isArray(data.suggestions) && data.suggestions.length
      ? data.suggestions
          .filter((x): x is string => typeof x === "string")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

  let suggestions = sugRaw;
  if (sugRaw?.length) {
    const seen = new Set<string>();
    suggestions = sugRaw.filter((s) => {
      if (!s.length || seen.has(s)) return false;
      seen.add(s);
      return true;
    });
    if (!suggestions.length) suggestions = undefined;
  }

  let nexoInternalV1: NexoInternalV1ApiPayload | undefined;
  const rawNexo = data.nexoInternalV1;
  if (
    rawNexo &&
    typeof rawNexo === "object" &&
    typeof rawNexo.sigmaTier === "number" &&
    Array.isArray(rawNexo.systemWhispers)
  ) {
    const whispers = rawNexo.systemWhispers
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean);
    if (whispers.length) {
      nexoInternalV1 = {
        sigmaTier: Math.max(0, Math.min(5, Math.round(rawNexo.sigmaTier))),
        systemWhispers: whispers,
      };
    }
  }

  return {
    narration: data.narration.trim(),
    rollingSummary: data.rollingSummary?.trim(),
    suggestions,
    ...(rollPrompt ? { rollPrompt } : {}),
    ...(nexoInternalV1 ? { nexoInternalV1 } : {}),
  };
}
