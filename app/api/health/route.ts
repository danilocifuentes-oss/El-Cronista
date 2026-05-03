import { NextResponse } from "next/server";

import type { NarradorRequestBody } from "@/lib/narrativeTypes";

export const runtime = "nodejs";

/**
 * Comprobación rápida en producción (Vercel): servidor vivo y presencia de GEMINI_API_KEY.
 * No expone la clave ni llama a Google.
 */
export async function GET() {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY?.trim());

  const bodyExample: NarradorRequestBody = {
    playerAction: "Entro al antro con la capucha baja y busco al camarero.",
    recentLogs: [
      { role: "sistema", text: "[MJ_PIPE]: Ambiente tenso, música baja." },
      { role: "jugador", text: "¿Hay alguien que encaje con la descripción?" },
    ],
    sheetSummary: "Nombre: Ejemplo\nLinaje: Nosferatu\nHambre Σ: 2/5",
    inquisitionThreat: 2,
    mjDirectives: ["Mantén el tono urbano gótico.", "No revelar al príncipe todavía."],
    rollingSummary: "El PJ está en un bar del centro, de noche.",
    ideasRepository: "Arco: reunión con el Sheriff el viernes. NPC recurrente: la camarera mortal.",
    narrativeStrand: "principal" as const,
    crossStrandContext:
      "· Paralela: negocios con el barón del barrio bajo.\n· En vivo: la mesa del sábado dejó un rumor sobre cazadores.",
  };

  return NextResponse.json({
    ok: true,
    service: "el-cronista-de-las-sombras",
    geminiConfigured,
    endpoints: {
      health: "GET /api/health",
      narrador: "POST /api/narrador (canal TX — requiere GEMINI_API_KEY)",
      cronista: "POST /api/cronista (MANIFESTAR — stream o JSON; misma clave)",
    },
    ejemploPostNarrador: {
      url: "/api/narrador",
      headers: { "Content-Type": "application/json" },
      body: bodyExample,
    },
  });
}
