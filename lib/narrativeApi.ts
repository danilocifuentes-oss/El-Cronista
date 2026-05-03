import { parseFetchJson } from "@/lib/parseFetchJson";
import type { NarradorApiResponse, NarradorRequestBody } from "@/lib/narrativeTypes";

/**
 * Llama al narrador Gemini vía `/api/narrador` (clave solo en servidor).
 */
export async function askCronista(body: NarradorRequestBody): Promise<NarradorApiResponse> {
  const res = await fetch("/api/narrador", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await parseFetchJson<NarradorApiResponse & { error?: string; raw?: string }>(res);

  if (!res.ok) {
    throw new Error(data.error || `narrador HTTP ${res.status}`);
  }

  if (!data.narration?.trim()) {
    throw new Error(data.error || "Respuesta sin narración.");
  }

  return {
    narration: data.narration.trim(),
    rollingSummary: data.rollingSummary?.trim(),
    suggestions: Array.isArray(data.suggestions)
      ? data.suggestions.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean)
      : undefined,
  };
}
