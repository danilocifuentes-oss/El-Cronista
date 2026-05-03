/**
 * Reintentos con backoff ante 429/cuota y resolución de modelos (principal + fallback).
 */

export const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";
export const DEFAULT_GEMINI_FALLBACK = "gemini-1.5-flash";

export function resolveGeminiModels(): { primary: string; fallback: string } {
  return {
    primary: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
    fallback: process.env.GEMINI_MODEL_FALLBACK?.trim() || DEFAULT_GEMINI_FALLBACK,
  };
}

export function isQuotaOrRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("429") ||
    msg.includes("Too Many Requests") ||
    /quota|Quota exceeded|RESOURCE_EXHAUSTED/i.test(msg)
  );
}

/** Extrae "retry in 25.11s" del mensaje de Google si existe. */
export function parseRetryDelayMs(message: string): number | null {
  const m = message.match(/retry in\s+([\d.]+)\s*s/i);
  if (m) {
    const sec = parseFloat(m[1]);
    if (Number.isFinite(sec)) return Math.min(60000, Math.ceil(sec * 1000));
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type BackoffOpts = {
  maxAttempts: number;
  baseDelayMs: number;
  label: string;
  /**
   * Techo por espera ante 429 (ms). En serverless (Vercel) hay que evitar sumar > maxDuration.
   * Por defecto 10s; antes se usaba hasta 55s e ilimitado con 4 intentos → fácil superar 60s.
   */
  capWaitMs?: number;
};

/**
 * Reintento con backoff exponencial; si el error incluye "retry in Xs", respeta un techo razonable.
 */
export async function withExponentialBackoff<T>(fn: () => Promise<T>, opts: BackoffOpts): Promise<T> {
  const cap = opts.capWaitMs ?? 10_000;
  let lastErr: unknown;
  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const last = attempt === opts.maxAttempts - 1;
      if (!isQuotaOrRateLimitError(e) || last) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      const hint = parseRetryDelayMs(msg);
      const exp = opts.baseDelayMs * Math.pow(2, attempt);
      const waitMs = Math.min(cap, Math.min(55_000, hint ?? exp));
      console.warn(`[gemini:${opts.label}] 429/cuota · intento ${attempt + 1}/${opts.maxAttempts} · espera ${waitMs}ms`);
      await sleep(waitMs);
    }
  }
  throw lastErr;
}
