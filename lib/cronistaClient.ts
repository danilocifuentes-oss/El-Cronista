import type { CharacterSheet } from "@/lib/character";
import type { ChroniclePayload } from "@/lib/narrativeTypes";
import type { SerializedV5Roll } from "@/lib/dice";
import type { NarrativeStrand } from "@/lib/narrativeStrands";

export type CronistaRecentLine = { role: string; text: string };

export type CronistaMotorBody = {
  codex: CharacterSheet;
  tirada: SerializedV5Roll;
  hambre: number;
  input: string;
  recentLogs: CronistaRecentLine[];
  chronicle?: ChroniclePayload;
  synapticDisruption?: string;
  ideasRepository?: string;
  narrativeStrand: NarrativeStrand;
  crossStrandContext?: string;
};

export async function fetchCronistaJson(body: CronistaMotorBody): Promise<{ narration: string }> {
  const res = await fetch("/api/cronista", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, stream: false }),
  });
  const data = (await res.json()) as { narration?: string; error?: string };
  if (!res.ok) throw new Error(data.error || `cronista HTTP ${res.status}`);
  const narration = typeof data.narration === "string" ? data.narration.trim() : "";
  if (!narration) throw new Error(data.error || "Sin narración.");
  return { narration };
}

/** Streaming token a token (UTF-8); fallback si el navegador no soporta streams. */
export async function streamCronistaMotor(
  body: CronistaMotorBody,
  onChunk: (delta: string) => void,
): Promise<void> {
  const res = await fetch("/api/cronista", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, stream: true }),
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      /* texto plano */
    }
    throw new Error(msg);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Sin cuerpo de respuesta (stream).");

  const dec = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = dec.decode(value, { stream: true });
    if (chunk) onChunk(chunk);
  }
}

/** Intenta streaming; si falla la tubería, una sola respuesta JSON (sin cortar la mesa). */
export async function streamCronistaMotorWithFallback(
  body: CronistaMotorBody,
  onChunk: (delta: string) => void,
): Promise<void> {
  try {
    await streamCronistaMotor(body, onChunk);
  } catch {
    const { narration } = await fetchCronistaJson(body);
    onChunk(narration);
  }
}
