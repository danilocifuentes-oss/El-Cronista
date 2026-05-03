import { NextResponse } from "next/server";

import { formatOrchestrationForPrompt, orchestrateManifestTurn } from "@/lib/gameWorld";
import { isNarratorChannelPaused } from "@/lib/operatorRuntimeSettings";
import { formatNexoApiFailure } from "@/lib/nexoErrors";
import { sanitizePlayerFacingNarration } from "@/lib/playerFacingText";
import { isQuotaOrRateLimitError } from "@/lib/geminiRetry";

import type { NormalizedCronistaBody } from "./cronistaPayload";
import { compactCodex } from "./cronistaPayload";
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

async function cronistaJsonResponse(parsed: NormalizedCronistaBody): Promise<Response> {
  const userPrompt = await buildCronistaPromptFromParsed(parsed);

  const chain = resolveDriverChain();
  let lastErr: unknown;

  for (const driver of chain) {
    try {
      if (driver === "gemini") {
        const raw = await jsonCronistaGemini(userPrompt);
        const narration = parseNarracionJson(raw);
        if (narration) {
          return NextResponse.json({ narration: sanitizePlayerFacingNarration(narration) });
        }
        throw new Error("narracion vacía (Gemini JSON).");
      }
      if (driver === "openai") {
        const raw = await jsonCronistaOpenAi(userPrompt);
        const narration = parseNarracionJson(raw);
        if (narration) {
          return NextResponse.json({ narration: sanitizePlayerFacingNarration(narration) });
        }
        throw new Error("narracion vacía (OpenAI JSON).");
      }
      const narration = internalNarration(parsed);
      return NextResponse.json({ narration: sanitizePlayerFacingNarration(narration) });
    } catch (e) {
      lastErr = e;
      console.warn("[cronista json] driver:", driver, e);
    }
  }

  const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  const status = lastErr && isQuotaOrRateLimitError(lastErr) ? 503 : 502;
  return NextResponse.json({ error: formatNexoApiFailure(msg) }, { status });
}

async function cronistaStreamResponse(parsed: NormalizedCronistaBody): Promise<Response> {
  const userPrompt = await buildCronistaPromptFromParsed(parsed);

  const chain = resolveDriverChain();
  let lastErr: unknown;

  for (const driver of chain) {
    try {
      if (driver === "gemini") {
        const stream = await streamCronistaGemini(userPrompt);
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of stream) {
                const t = chunk.text();
                if (t) controller.enqueue(encoder.encode(t));
              }
              controller.close();
            } catch (e) {
              controller.error(e);
            }
          },
        });
        return new Response(readable, { headers: STREAM_HEADERS });
      }
      if (driver === "openai") {
        const plain = await streamCronistaOpenAiReadable(userPrompt);
        return new Response(plain, { headers: STREAM_HEADERS });
      }
      const text = internalNarration(parsed);
      return new Response(internalCronistaReadableStream(text), { headers: STREAM_HEADERS });
    } catch (e) {
      lastErr = e;
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
