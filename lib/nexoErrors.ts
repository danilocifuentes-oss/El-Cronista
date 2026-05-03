/**
 * Mensajes diegéticos para el canal (evita volcar errores crudos de Google al jugador).
 */
export function formatNexoApiFailure(raw: string): string {
  const msg = raw.trim();
  if (/^\[(ERR_|PIPE_ERR)/.test(msg)) {
    return msg;
  }

  if (/GEMINI_API_KEY no está definida|GEMINI_API_KEY/i.test(msg) && /definida|Configura/i.test(msg)) {
    return "[ERR_CONFIG]: El Nexo no tiene clave de motor GEMINI en el servidor. Revisa .env.local o Vercel.";
  }

  if (
    msg.includes("429") ||
    msg.includes("Too Many Requests") ||
    /quota|Quota exceeded|RESOURCE_EXHAUSTED|free_tier|rate.?limit/i.test(msg)
  ) {
    return "[ERR_NODO_SATURADO]: La red de La Chimba está bajo vigilancia intensa. Protocolo de silencio activado temporalmente. Espera a que la señal se estabilice y vuelve a intentar.";
  }

  if (/503|502|fetch failed|network/i.test(msg)) {
    return "[ERR_RELÉ]: El canal SchreckNet perdió pulso momentáneo. Reintenta en unos segundos.";
  }

  const short = msg.length > 280 ? `${msg.slice(0, 280)}…` : msg;
  return `[PIPE_ERR]: ${short}`;
}
