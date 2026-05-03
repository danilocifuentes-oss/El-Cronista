import type { SessionMeta } from "./sessionMeta";
import { normalizeSessionMeta } from "./sessionMeta";

const DAY_MS = 86_400_000;
/** “Letargo social” — sin acción significativa. */
const INERTIA_MS = 5 * DAY_MS;

function asMeta(m: SessionMeta | Partial<SessionMeta>): SessionMeta {
  return normalizeSessionMeta(m);
}

/** Cada 24 h se restablece el cupo diario (2 UI). */
export function tickImpulseRefill(meta: SessionMeta): SessionMeta {
  const m = { ...asMeta(meta) };
  let u = m.impulseUnits;
  let last = m.lastImpulseRefillAt;
  const now = Date.now();
  while (now - last >= DAY_MS) {
    u = 2;
    last += DAY_MS;
  }
  return normalizeSessionMeta({ ...m, impulseUnits: u, lastImpulseRefillAt: last });
}

export function isInLetargo(meta: SessionMeta): boolean {
  const m = tickImpulseRefill(meta);
  return nowMs() - m.lastSignificantActionAt > INERTIA_MS;
}

function nowMs() {
  return Date.now();
}

/** Penalización oculta a la reserva (mínimo 1 dado). */
export function letargoPoolPenalty(meta: SessionMeta): number {
  return isInLetargo(meta) ? 1 : 0;
}

/** Tras una manifestación válida: −1 UI y actualiza acción significativa. */
export function completeImpulseSpend(meta: SessionMeta): SessionMeta {
  const t = tickImpulseRefill(meta);
  const u = Math.max(0, t.impulseUnits - 1);
  return normalizeSessionMeta({
    ...t,
    impulseUnits: u,
    lastSignificantActionAt: nowMs(),
  });
}

/** Mensaje o interacción que no gasta UI pero reanima el ritmo (p. ej. canal). */
export function touchSignificantAction(meta: SessionMeta): SessionMeta {
  return normalizeSessionMeta({
    ...tickImpulseRefill(meta),
    lastSignificantActionAt: nowMs(),
  });
}
