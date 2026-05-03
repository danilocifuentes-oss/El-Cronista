import { NextResponse } from "next/server";

import {
  campaignStoreAppend,
  campaignStoreList,
  isCampaignStoreConfigured,
} from "@/lib/campaignRedisStore";
import { normalizeCampaignId, parseCampaignPostBody } from "@/lib/campaignTypes";
import { normalizeStrand } from "@/lib/narrativeStrands";

export const runtime = "nodejs";

function disabledResponse() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Sincronización de campaña no configurada en el servidor (falta UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN). El Nexo sigue en modo local.",
      storeDisabled: true,
    },
    { status: 503 },
  );
}

export async function POST(req: Request) {
  if (!isCampaignStoreConfigured()) return disabledResponse();

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }
  if (!raw || typeof raw !== "object") {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }
  const campaignId = normalizeCampaignId(typeof (raw as Record<string, unknown>).campaignId === "string" ? (raw as Record<string, unknown>).campaignId as string : "");
  if (!campaignId) {
    return NextResponse.json({ ok: false, error: "campaignId requerido." }, { status: 400 });
  }

  const entry = parseCampaignPostBody(raw as Record<string, unknown>);
  if (!entry) {
    return NextResponse.json({ ok: false, error: "Entrada inválida." }, { status: 400 });
  }

  try {
    await campaignStoreAppend(campaignId, entry);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("CAMPAIGN_STORE_DISABLED")) return disabledResponse();
    console.error("[api/campaign/entry POST]", msg);
    return NextResponse.json({ ok: false, error: "No se pudo guardar." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  if (!isCampaignStoreConfigured()) {
    return NextResponse.json({ entries: [], storeDisabled: true }, { status: 200 });
  }

  const url = new URL(req.url);
  const campaignId = normalizeCampaignId(url.searchParams.get("campaignId") || "");
  const strandRaw = url.searchParams.get("strand") || "principal";
  const strand = normalizeStrand(strandRaw);
  const limit = Math.min(80, Math.max(1, Number(url.searchParams.get("limit")) || 24));

  if (!campaignId) {
    return NextResponse.json({ ok: false, error: "campaignId requerido." }, { status: 400 });
  }

  try {
    const entries = await campaignStoreList(campaignId, { strand, limit });
    return NextResponse.json({ entries, storeDisabled: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("CAMPAIGN_STORE_DISABLED")) {
      return NextResponse.json({ entries: [], storeDisabled: true });
    }
    console.error("[api/campaign/entry GET]", msg);
    return NextResponse.json({ ok: false, error: "No se pudo leer." }, { status: 500 });
  }
}
