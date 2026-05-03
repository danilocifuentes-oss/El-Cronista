import { NextResponse } from "next/server";

import { getOperatorRuntimeState } from "@/lib/operatorRuntimeSettings";

export const runtime = "nodejs";

/**
 * Sesión Nexo pública: epoch de reset global para que todos los navegadores
 * alineen borrado de personajes / Nexo / Génesis sin clave operador.
 */
export async function GET() {
  const { clientResetEpoch } = getOperatorRuntimeState();
  return NextResponse.json(
    {
      ok: true as const,
      clientResetEpoch: typeof clientResetEpoch === "number" ? clientResetEpoch : 0,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
