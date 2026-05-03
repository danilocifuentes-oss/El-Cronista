/**
 * Texto breve sin códigos backstage para errores visible en canal (operador revisa servidor).
 */
export function formatNexoApiFailure(raw: string): string {
  const msg = raw.trim();
  if (msg.includes("OPERATOR_CHANNEL_PAUSED") || msg.includes("NEXO_CHANNEL_PAUSED")) {
    return "El canal desde acá está en pausa. Quien lleva los mandos debe reactivar el flujo antes de seguir jugando estas líneas.";
  }

  if (/GEMINI_API_KEY no está definida|GEMINI_API_KEY/i.test(msg) && /definida|Configura/i.test(msg)) {
    return "Algo del lado servidor no encuentra llave válida para el motor remoto — conviene revisar despliegue y variables antes de insistir.";
  }

  if (
    /API key not valid|API_KEY_INVALID|invalid API key|leaked|was reported|PERMISSION_DENIED.*key/i.test(msg) ||
    (/(^|\D)(401|403)(\D|$)/.test(msg) && /generative|googleapis|GoogleGenerative|gemini|API key/i.test(msg))
  ) {
    return "La llamada rechazó la llave configurada como si fuera fría ya— conviene revisar credenciales en el servidor y volver a desplegar.";
  }

  if (
    msg.includes("429") ||
    msg.includes("Too Many Requests") ||
    /quota|Quota exceeded|RESOURCE_EXHAUSTED|free_tier|rate.?limit/i.test(msg)
  ) {
    return "Hay demasiada cola cargando detrás — la señal pide esperar un momento antes del próximo mensaje.";
  }

  if (/timed out|Task timed out|504|Gateway Timeout|FUNCTION_INVOCATION_TIMEOUT|Runtime Timeout/i.test(msg)) {
    return "La red cortó antes de llegar respuesta larga — reintentá tras unos segundos o más breve donde puedas.";
  }

  if (/503|502|fetch failed|network/i.test(msg)) {
    return "El vínculo con el servidor se quebró un instante; probá de nuevo cuando el pulso estabilice.";
  }

  if (/no devolvió JSON|Respuesta no JSON|no JSON/i.test(msg)) {
    return "En vez de historia llegó algo ilegible al canal — tocó caída o proxy cortado.";
  }

  const short = msg.length > 220 ? `${msg.slice(0, 220)}…` : msg;
  return short ? `Algo falló antes de llegar la escena: ${short}` : "Algo falló antes de llegar la escena.";
}
