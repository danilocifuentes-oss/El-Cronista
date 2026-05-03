import { NextResponse } from "next/server";

import { formatNexoApiFailure } from "@/lib/nexoErrors";
import { isNarrativeStrand, type NarrativeStrand } from "@/lib/narrativeStrands";
import type { ChroniclePayload, NarradorRequestBody } from "@/lib/narrativeTypes";
import { executeNarradorPipeline } from "@/lib/narrativeDrivers/runNarrador";
import { isQuotaOrRateLimitError } from "@/lib/geminiRetry";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_ACTION = 4500;
const MAX_LINE = 1800;
/** Solo los últimos turnos al motor (ahorra tokens y presión de cuota). */
const NEXO_RECENT_TURNS = 6;
const MAX_SHEET_SUMMARY = 4500;
const MAX_CHRON = 8000;
const MAX_SYNAPTIC = 4000;
const MAX_IDEAS = 6000;
const MAX_CROSS = 4000;

function clampStr(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  return s.length <= max ? s : `${s.slice(0, max)}\n[…]`;
}

function normalizeBody(raw: unknown): NarradorRequestBody | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const playerAction = clampStr(o.playerAction, MAX_ACTION);
  if (!playerAction.trim()) return null;

  const sheetSummary = clampStr(o.sheetSummary, MAX_SHEET_SUMMARY);
  const threat = Number(o.inquisitionThreat);
  const inquisitionThreat =
    Number.isFinite(threat) ? Math.max(0, Math.min(5, Math.round(threat))) : 0;

  let recentLogs: NarradorRequestBody["recentLogs"] = [];
  if (Array.isArray(o.recentLogs)) {
    recentLogs = o.recentLogs
      .slice(-NEXO_RECENT_TURNS)
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const r = row as Record<string, unknown>;
        const role = typeof r.role === "string" ? r.role.slice(0, 24) : "?";
        const text = clampStr(r.text, MAX_LINE);
        return text.trim() ? { role, text } : null;
      })
      .filter((x): x is { role: string; text: string } => Boolean(x));
  }

  let mjDirectives: string[] = [];
  if (Array.isArray(o.mjDirectives)) {
    mjDirectives = o.mjDirectives
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => clampStr(x, 4000))
      .slice(-14);
  }

  const rollingSummary = o.rollingSummary ? clampStr(o.rollingSummary, 4000) : "";

  let chronicle: ChroniclePayload | undefined;
  if (o.chronicle && typeof o.chronicle === "object") {
    const c = o.chronicle as Record<string, unknown>;
    chronicle = {
      foundations: clampStr(c.foundations, MAX_CHRON),
      AMBIENTE: clampStr(c.AMBIENTE, 2000),
      TENSION: clampStr(c.TENSION, 2000),
      ESTADO_GLOBAL: clampStr(c.ESTADO_GLOBAL, 2000),
      VINCULO_HILOS: c.VINCULO_HILOS ? clampStr(c.VINCULO_HILOS, 2000) : undefined,
    };
  }

  const synapticDisruption = o.synapticDisruption ? clampStr(o.synapticDisruption, MAX_SYNAPTIC) : "";
  const ideasRepository = o.ideasRepository ? clampStr(o.ideasRepository, MAX_IDEAS) : "";
  const narrativeStrandRaw = typeof o.narrativeStrand === "string" ? o.narrativeStrand : "";
  const narrativeStrand: NarrativeStrand = isNarrativeStrand(narrativeStrandRaw) ? narrativeStrandRaw : "principal";
  const crossStrandContext = o.crossStrandContext ? clampStr(o.crossStrandContext, MAX_CROSS) : "";

  return {
    playerAction,
    recentLogs,
    sheetSummary,
    inquisitionThreat,
    mjDirectives,
    rollingSummary: rollingSummary.trim() || undefined,
    chronicle,
    synapticDisruption: synapticDisruption.trim() || undefined,
    ideasRepository: ideasRepository.trim() || undefined,
    narrativeStrand,
    crossStrandContext: crossStrandContext.trim() || undefined,
  };
}

export async function POST(req: Request) {
  let rawJson: unknown;
  try {
    rawJson = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const body = normalizeBody(rawJson);
  if (!body) {
    return NextResponse.json({ error: "playerAction requerido o vacío." }, { status: 400 });
  }

  try {
    const out = await executeNarradorPipeline(body);
    return NextResponse.json({
      narration: out.narration,
      rollingSummary: out.rollingSummary,
      ...(out.suggestions?.length ? { suggestions: out.suggestions } : {}),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/narrador]", msg);
    if (msg.includes("OPERATOR_CHANNEL_PAUSED")) {
      return NextResponse.json(
        {
          error: formatNexoApiFailure(
            "Canal narrativo en pausa. El operador puede reactivarlo en Centro de Mando → Motor Nexo.",
          ),
        },
        { status: 503 },
      );
    }
    const immersive = formatNexoApiFailure(msg);
    const status = isQuotaOrRateLimitError(e) ? 503 : 502;
    return NextResponse.json({ error: immersive }, { status });
  }
}
