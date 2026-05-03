import { NextResponse } from "next/server";

import { executePulsoMundo, internalPulsoDual } from "@/lib/narrativeDrivers/runPulsoMundo";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(req: Request) {
  let ciudadHint = "";
  try {
    const body = (await req.json()) as { ciudad?: unknown };
    if (typeof body.ciudad === "string") ciudadHint = body.ciudad.slice(0, 120);
  } catch {
    ciudadHint = "";
  }

  try {
    const dual = await executePulsoMundo(ciudadHint);
    return NextResponse.json({
      eco_visible: dual.ecoVisible,
      eco_sombras: dual.ecoSombras,
    });
  } catch {
    const dual = internalPulsoDual(ciudadHint);
    return NextResponse.json({
      eco_visible: dual.ecoVisible,
      eco_sombras: dual.ecoSombras,
    });
  }
}
