import { NextResponse } from "next/server";

import { normalizeCronistaBody } from "@/lib/narrativeDrivers/cronistaPayload";
import { executeCronistaRoute } from "@/lib/narrativeDrivers/runCronista";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  let rawJson: unknown;
  try {
    rawJson = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = normalizeCronistaBody(rawJson);
  if (!parsed || !parsed.codex || !parsed.tirada) {
    return NextResponse.json({ error: "codex y tirada son obligatorios." }, { status: 400 });
  }

  return executeCronistaRoute(parsed);
}
