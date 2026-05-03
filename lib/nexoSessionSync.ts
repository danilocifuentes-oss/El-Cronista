/** Epoch de “nueva crónica global” mandada desde operador; todos los clientes comparan y limpian. */
export const CLIENT_RESET_EPOCH_KEY = "cronista-client-reset-epoch-v1";

export async function fetchServerClientResetEpoch(): Promise<number> {
  try {
    const res = await fetch("/api/nexo-session", { cache: "no-store" });
    if (!res.ok) return 0;
    const j = (await res.json()) as { clientResetEpoch?: unknown };
    const n = j.clientResetEpoch;
    return typeof n === "number" && Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  } catch {
    return 0;
  }
}

export function readLocalClientResetEpoch(): number {
  if (typeof window === "undefined") return 0;
  const n = parseInt(localStorage.getItem(CLIENT_RESET_EPOCH_KEY) ?? "0", 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function writeLocalClientResetEpoch(n: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLIENT_RESET_EPOCH_KEY, String(Math.max(0, Math.floor(n))));
}
