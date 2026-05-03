import { NextResponse } from "next/server";

import { isGeminiConfigured, whichGeminiEnvName } from "@/lib/geminiEnv";
import type { NarradorRequestBody } from "@/lib/narrativeTypes";

export const runtime = "nodejs";

/**
 * Comprobación rápida en producción (Vercel): servidor vivo y presencia de clave Gemini (ver geminiEnv).
 * No expone la clave ni llama a Google.
 */
export async function GET() {
  const geminiConfigured = isGeminiConfigured();
  const geminiEnvNameUsed = whichGeminiEnvName();

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
    /** Qué variable detectó el servidor (sin valor). Ausente si ninguna está definida. */
    geminiEnvNameUsed,
    envCanonical: "GEMINI_API_KEY",
    envAliasesAccepted: ["GOOGLE_GENERATIVE_AI_API_KEY"],
    /** Solo comprueba que la variable exista en runtime; no valida la clave contra Google. */
    note:
      "El nombre «Gemini API Key» en Google AI Studio es solo etiqueta. En Vercel debe llamarse la variable GEMINI_API_KEY (o alias GOOGLE_GENERATIVE_AI_API_KEY). Marca Production y Redeploy.",
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
