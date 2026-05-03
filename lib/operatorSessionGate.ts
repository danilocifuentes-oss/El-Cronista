/** Sesión Centro de Mando: sólo se abre tras autenticar con ROOT_OPERATOR_CIPHER en login. */

import { ROOT_OPERATOR_CIPHER } from "@/lib/sessionMeta";

const KEY = "cronista-operator-unlock";

export function setOperatorSessionUnlocked(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, ROOT_OPERATOR_CIPHER);
  } catch {
    /* */
  }
}

export function clearOperatorSessionUnlock(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* */
  }
}

export function isOperatorSessionUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(KEY) === ROOT_OPERATOR_CIPHER;
  } catch {
    return false;
  }
}
