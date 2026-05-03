import { NextResponse } from "next/server";

import { formatOrchestrationForPrompt, orchestrateManifestTurn } from "@/lib/gameWorld";
import { isNarratorChannelPaused } from "@/lib/operatorRuntimeSettings";
import { formatNexoApiFailure } from "@/lib/nexoErrors";
import { sanitizePlayerFacingNarration } from "@/lib/playerFacingText";
import { isQuotaOrRateLimitError } from "@/lib/geminiRetry";

import type { NormalizedCronistaBody } from "./cronistaPayload";
import { compactCodex } from "./cronistaPayload";
import { applyDriverCircuitToChain, recordExternalDriverFailure, recordExternalDriverSuccess } from "./llmCircuitBreaker";
import { acceptCronistaNarration } from "./llmOutputAcceptance";
import { resolveDriverChain } from "./config";
import { jsonCronistaGemini, streamCronistaGemini } from "./geminiCronista";
import { generateInternalCronista } from "./internalCronista";
import { jsonCronistaOpenAi, streamCronistaOpenAiReadable } from "./openAiCronista";
import { buildCronistaUserPrompt } from "./prompts";

async function buildCronistaPromptFromParsed(parsed: NormalizedCronistaBody): Promise<string> {
  const world = await orchestrateManifestTurn(parsed.input.slice(0, 200), parsed.narrativeStrand);
  const orchestrationBlock = formatOrchestrationForPrompt(world);
  return buildCronistaUserPrompt({
    codexJson: compactCodex(parsed.codex),
    tirada: parsed.tirada,
    hambre: parsed.hambre,
    input: parsed.input,
    recentLogs: parsed.recentLogs,
    chronicle: parsed.chronicle,
    synapticDisruption: parsed.synapticDisruption,
    ideasRepository: parsed.ideasRepository,
    narrativeStrand: parsed.narrativeStrand,
    crossStrandContext: parsed.crossStrandContext,
    worldNexusContext: parsed.worldNexusContext,
    orchestrationBlock,
  });
}

const STREAM_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store",
};

function internalNarration(parsed: NormalizedCronistaBody): string {
  return generateInternalCronista({
    tirada: parsed.tirada,
    hambre: parsed.hambre,
    input: parsed.input,
    narrativeStrand: parsed.narrativeStrand,
    sheetName: parsed.codex.name?.trim() || "Sujeto",
    clan: parsed.codex.clan,
    synapticDisruption: parsed.synapticDisruption,
  });
}

/** Trocea texto para imitar streaming sin bloquear el hilo. */
function internalCronistaReadableStream(text: string): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  const parts = text.split(/(\s+)/).filter((x) => x.length > 0);
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i >= parts.length) {
        controller.close();
        return;
      }
      controller.enqueue(enc.encode(parts[i]));
      i += 1;
    },
  });
}

function parseNarracionJson(raw: string): string | null {
  try {
    const j = JSON.parse(raw) as { narracion?: string };
    const n = typeof j.narracion === "string" ? j.narracion.trim() : "";
    return n || null;
  } catch {
    return null;
  }
}

async function drainGeminiTextStream(stream: AsyncIterable<{ text(): string }>): Promise<string> {
  let acc = "";
  for await (const chunk of stream) {
    const t = chunk.text();
    if (t) acc += t;
    if (acc.length > 36_000) break;
  }
  return acc;
}

async function drainUtf8ReadableStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const dec = new TextDecoder();
  let acc = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) acc += dec.decode(value, { stream: true });
      if (acc.length > 36_000) break;
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* ya liberado o stream en error */
    }
  }
  acc += dec.decode();
  return acc;
}

async function cronistaJsonResponse(parsed: NormalizedCronistaBody): Promise<Response> {
  const userPrompt = await buildCronistaPromptFromParsed(parsed);

  const chain = applyDriverCircuitToChain(resolveDriverChain());
  let lastErr: unknown;

  for (const driver of chain) {
    try {
      if (driver === "gemini") {
        const raw = await jsonCronistaGemini(userPrompt);
        const narration = parseNarracionJson(raw);
        const cleaned = narration ? sanitizePlayerFacingNarration(narration) : "";
        if (cleaned && acceptCronistaNarration(cleaned).ok) {
          recordExternalDriverSuccess("gemini");
          return NextResponse.json({ narration: cleaned });
        }
        recordExternalDriverFailure("gemini");
        lastErr = new Error("Gemini JSON · narración vacía o no aceptable.");
        console.warn("[cronista json]", lastErr);
        continue;
      }
      if (driver === "openai") {
        const raw = await jsonCronistaOpenAi(userPrompt);
        const narration = parseNarracionJson(raw);
        const cleaned = narration ? sanitizePlayerFacingNarration(narration) : "";
        if (cleaned && acceptCronistaNarration(cleaned).ok) {
          recordExternalDriverSuccess("openai");
          return NextResponse.json({ narration: cleaned });
        }
        recordExternalDriverFailure("openai");
        lastErr = new Error("OpenAI JSON · narración vacía o no aceptable.");
        console.warn("[cronista json]", lastErr);
        continue;
      }
      const narration = internalNarration(parsed);
      return NextResponse.json({ narration: sanitizePlayerFacingNarration(narration) });
    } catch (e) {
      lastErr = e;
      if (driver === "gemini" || driver === "openai") recordExternalDriverFailure(driver);
      console.warn("[cronista json] driver:", driver, e);
    }
  }

  const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  const status = lastErr && isQuotaOrRateLimitError(lastErr) ? 503 : 502;
  return NextResponse.json({ error: formatNexoApiFailure(msg) }, { status });
}

async function cronistaStreamResponse(parsed: NormalizedCronistaBody): Promise<Response> {
  const userPrompt = await buildCronistaPromptFromParsed(parsed);

  const chain = applyDriverCircuitToChain(resolveDriverChain());
  let lastErr: unknown;

  for (const driver of chain) {
    try {
      if (driver === "gemini") {
        const stream = await streamCronistaGemini(userPrompt);
        const raw = await drainGeminiTextStream(stream);
        const cleaned = sanitizePlayerFacingNarration(raw.trim());
        if (cleaned && acceptCronistaNarration(cleaned).ok) {
          recordExternalDriverSuccess("gemini");
          return new Response(internalCronistaReadableStream(cleaned), { headers: STREAM_HEADERS });
        }
        recordExternalDriverFailure("gemini");
        lastErr = new Error("Gemini stream · texto no aceptable.");
        console.warn("[cronista stream]", lastErr);
        continue;
      }
      if (driver === "openai") {
        const plain = await streamCronistaOpenAiReadable(userPrompt);
        const raw = await drainUtf8ReadableStream(plain);
        const cleaned = sanitizePlayerFacingNarration(raw.trim());
        if (cleaned && acceptCronistaNarration(cleaned).ok) {
          recordExternalDriverSuccess("openai");
          return new Response(internalCronistaReadableStream(cleaned), { headers: STREAM_HEADERS });
        }
        recordExternalDriverFailure("openai");
        lastErr = new Error("OpenAI stream · texto no aceptable.");
        console.warn("[cronista stream]", lastErr);
        continue;
      }
      const text = internalNarration(parsed);
      return new Response(internalCronistaReadableStream(text), { headers: STREAM_HEADERS });
    } catch (e) {
      lastErr = e;
      if (driver === "gemini" || driver === "openai") recordExternalDriverFailure(driver);
      console.warn("[cronista stream] driver:", driver, e);
    }
  }

  const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  const status = lastErr && isQuotaOrRateLimitError(lastErr) ? 503 : 502;
  return NextResponse.json({ error: formatNexoApiFailure(msg) }, { status });
}

export async function executeCronistaRoute(parsed: NormalizedCronistaBody): Promise<Response> {
  if (isNarratorChannelPaused()) {
    return NextResponse.json(
      {
        error: formatNexoApiFailure(
          "OPERATOR_CHANNEL_PAUSED · El canal narrativo está en pausa (Centro de Mando o NEXO_CHANNEL_PAUSED).",
        ),
      },
      { status: 503 },
    );
  }
  if (parsed.stream) {
    return cronistaStreamResponse(parsed);
  }
  return cronistaJsonResponse(parsed);
}
