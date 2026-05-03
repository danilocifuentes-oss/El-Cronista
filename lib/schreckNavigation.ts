import type { Phase } from "./schreckPhase";

/** Sesión Nexo sin cookie: memoria por pestaña. */
export const SCHRECK_AUTH_KEY = "schreck-nexo-auth-v1";

export type SchreckRole = "player" | "narrator";

const VIEW_BY_PHASE: Record<Phase, string | null> = {
  login: null,
  profileHub: "hub",
  chargen: "codex",
  nexus: "nexo",
  sheetReview: "hoja",
  commandCenter: "mando",
};

const PHASE_BY_VIEW = Object.entries(VIEW_BY_PHASE).reduce((acc, [phase, view]) => {
  if (view) acc[view] = phase as Phase;
  return acc;
}, {} as Record<string, Phase>);

export function phaseToQueryParam(phase: Phase): string | null {
  return VIEW_BY_PHASE[phase];
}

export function queryParamToPhase(v: string | null): Phase | null {
  if (!v) return null;
  return PHASE_BY_VIEW[v] ?? null;
}

export function phaseToHref(phase: Phase): string {
  const q = VIEW_BY_PHASE[phase];
  return q ? `/?v=${encodeURIComponent(q)}` : "/";
}

export function readAuthRole(): SchreckRole | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SCHRECK_AUTH_KEY);
    return raw === "player" || raw === "narrator" ? raw : null;
  } catch {
    return null;
  }
}

export function writeAuthRole(role: SchreckRole) {
  try {
    sessionStorage.setItem(SCHRECK_AUTH_KEY, role);
  } catch {
    /* */
  }
}

export function clearSchreckAuth() {
  try {
    sessionStorage.removeItem(SCHRECK_AUTH_KEY);
  } catch {
    /* */
  }
}
