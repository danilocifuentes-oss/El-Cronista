import { NextResponse } from "next/server";

import {
  bumpClientResetEpoch,
  getOperatorRuntimeState,
  patchOperatorRuntimeState,
  type OperatorRuntimeState,
} from "@/lib/operatorRuntimeSettings";
import { resetOrchestrationWorld } from "@/lib/gameWorld";
import { ROOT_OPERATOR_CIPHER } from "@/lib/sessionMeta";

export const runtime = "nodejs";

type Body = {
  cipher?: string;
  action?: "get" | "save" | "reset_all_clients";
  externalLlmEnabled?: boolean;
  narratorChannelPaused?: boolean;
  seedContext?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (typeof body.cipher !== "string" || body.cipher.trim() !== ROOT_OPERATOR_CIPHER) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (body.action === "get") {
    const s = getOperatorRuntimeState();
    return NextResponse.json({ ok: true as const, ...s });
  }

  if (body.action === "save") {
    const patch: Partial<Omit<OperatorRuntimeState, "updatedAt">> = {};
    if (typeof body.externalLlmEnabled === "boolean") patch.externalLlmEnabled = body.externalLlmEnabled;
    if (typeof body.narratorChannelPaused === "boolean") patch.narratorChannelPaused = body.narratorChannelPaused;
    if (typeof body.seedContext === "string") patch.seedContext = body.seedContext;
    const next = patchOperatorRuntimeState(patch);
    return NextResponse.json({ ok: true as const, ...next });
  }

  if (body.action === "reset_all_clients") {
    await resetOrchestrationWorld();
    const next = bumpClientResetEpoch();
    return NextResponse.json({
      ok: true as const,
      ...next,
      orchestrationReset: true as const,
    });
  }

  return NextResponse.json({ error: 'Usa action "get", "save" o "reset_all_clients".' }, { status: 400 });
}
