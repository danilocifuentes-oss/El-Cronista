import { NextResponse } from "next/server";

import {
  commitOrchestrationWorld,
  getOrchestrationWorld,
  pushCommandEvent,
  resetOrchestrationWorld,
} from "@/lib/gameWorld";
import { ROOT_OPERATOR_CIPHER } from "@/lib/sessionMeta";

export const runtime = "nodejs";

type Body = {
  cipher?: string;
  action?: "get" | "reset" | "raid" | "bump_threat" | "advance_night" | "purge_events";
  intensity?: number;
  /** Para bump_threat: suma sobre σ suavizado 0–5. */
  delta?: number;
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
    return NextResponse.json({ ok: true as const, world: await getOrchestrationWorld() });
  }

  if (body.action === "reset") {
    return NextResponse.json({ ok: true as const, world: await resetOrchestrationWorld() });
  }

  const w = await getOrchestrationWorld();

  switch (body.action) {
    case "raid":
      pushCommandEvent(w, {
        type: "raid_inquisicion",
        intensity: Math.min(
          5,
          Math.max(1, typeof body.intensity === "number" && Number.isFinite(body.intensity) ? Math.round(body.intensity) : 4),
        ),
        detail: "ordenado desde operador",
      });
      w.log.push({ ts: Date.now(), tag: "comando", note: "raid" });
      await commitOrchestrationWorld(w);
      return NextResponse.json({ ok: true as const, world: await getOrchestrationWorld() });
    case "bump_threat": {
      const d =
        typeof body.delta === "number" && Number.isFinite(body.delta) ? body.delta : 1;
      w.threatSmoothed = Math.min(5, Math.max(0, w.threatSmoothed + d));
      w.log.push({ ts: Date.now(), tag: "comando", note: `bump_threat Δ${d}` });
      await commitOrchestrationWorld(w);
      return NextResponse.json({ ok: true as const, world: await getOrchestrationWorld() });
    }
    case "advance_night":
      w.night += 1;
      w.log.push({ ts: Date.now(), tag: "comando", note: "advance_night" });
      await commitOrchestrationWorld(w);
      return NextResponse.json({ ok: true as const, world: await getOrchestrationWorld() });
    case "purge_events":
      w.activeEvents = [];
      w.log.push({ ts: Date.now(), tag: "comando", note: "purge_events" });
      await commitOrchestrationWorld(w);
      return NextResponse.json({ ok: true as const, world: await getOrchestrationWorld() });
    default:
      return NextResponse.json(
        {
          error:
            'action requerido: "get"|"reset"|"raid"|"bump_threat"|"advance_night"|"purge_events".',
        },
        { status: 400 },
      );
  }
}
