/**
 * Ajustes globales del narrador operador (servidor).
 * Persistencia: memoria del proceso (Vercel: puede reiniciarse en cold start).
 * Refuerzo estable: variables NEXO_FORCE_INTERNAL_ONLY, NEXO_CHANNEL_PAUSED en el deploy.
 */

function trimEnv(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v || undefined;
}

export type OperatorRuntimeState = {
  /** Si es false, solo motor interno (sin Gemini/OpenAI). */
  externalLlmEnabled: boolean;
  /** Si es true, narrador y cronista rechazan con mensaje de pausa (pulso puede seguir en modo interno). */
  narratorChannelPaused: boolean;
  /** Texto inyectado en prompts como directriz global (inicio o continuación de campaña). */
  seedContext: string;
  /**
   * Cada incremento manda a **todos** los navegadores a limpiar personajes, Nexo y Génesis local
   * (polling en `/api/nexo-session`). Solo operador vía `reset_all_clients`.
   */
  clientResetEpoch: number;
  updatedAt: number;
};

const defaults: OperatorRuntimeState = {
  externalLlmEnabled: true,
  narratorChannelPaused: false,
  seedContext: "",
  clientResetEpoch: 0,
  updatedAt: 0,
};

declare global {
  var __operatorRuntime: OperatorRuntimeState | undefined;
}

function slot(): OperatorRuntimeState {
  if (!globalThis.__operatorRuntime) {
    globalThis.__operatorRuntime = { ...defaults };
  } else if (typeof globalThis.__operatorRuntime.clientResetEpoch !== "number") {
    globalThis.__operatorRuntime.clientResetEpoch = 0;
  }
  return globalThis.__operatorRuntime;
}

export function getOperatorRuntimeState(): OperatorRuntimeState {
  return { ...slot() };
}

export function patchOperatorRuntimeState(partial: Partial<Omit<OperatorRuntimeState, "updatedAt">>): OperatorRuntimeState {
  const s = slot();
  if (typeof partial.externalLlmEnabled === "boolean") s.externalLlmEnabled = partial.externalLlmEnabled;
  if (typeof partial.narratorChannelPaused === "boolean") s.narratorChannelPaused = partial.narratorChannelPaused;
  if (typeof partial.seedContext === "string") s.seedContext = partial.seedContext.slice(0, 12000);
  if (typeof partial.clientResetEpoch === "number" && Number.isFinite(partial.clientResetEpoch)) {
    s.clientResetEpoch = Math.max(0, Math.floor(partial.clientResetEpoch));
  }
  s.updatedAt = Date.now();
  return { ...s };
}

/** Incrementa la versión de crónica global que observan los clientes (sin tocar otros flags). */
export function bumpClientResetEpoch(): OperatorRuntimeState {
  const s = slot();
  s.clientResetEpoch = (s.clientResetEpoch ?? 0) + 1;
  s.updatedAt = Date.now();
  return { ...s };
}

/** APIs Gemini/OpenAI deshabilitadas por operador o por env. */
export function isExternalLlmBlocked(): boolean {
  if (trimEnv("NEXO_FORCE_INTERNAL_ONLY") === "1") return true;
  return !slot().externalLlmEnabled;
}

/** Canal jugador ↔ narrador detenido (mj puede usar env para cortar también). */
export function isNarratorChannelPaused(): boolean {
  if (trimEnv("NEXO_CHANNEL_PAUSED") === "1") return true;
  return slot().narratorChannelPaused;
}

/** Bloque opcional para prompts (servidor). */
export function getOperatorSeedBlock(): string {
  return slot().seedContext.trim();
}
