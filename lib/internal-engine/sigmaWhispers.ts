/** Líneas diegéticas tipo SchreckNet / subsistema — cuanto mayor σ, más ruido. */

const TIER_2 = [
  "SchreckNet · latencia anómala en nodo vecino · sesión no firmada.",
  "TRACE: tres pings sin ACK · posible espejo de ruta en tu bloque.",
] as const;

const TIER_3 = [
  "ALERTA σ: correlación débil entre cámaras municipales y apps civiles · alguien miente en el grafo.",
  "SchreckNet · cola de eventos saturada · patrón compatible con barrido inquisitorial (no confirmado).",
  "HEURÍSTICA: tu firma térmica aparece duplicada en dos cuadras · revisá sombra lateral.",
] as const;

const TIER_4 = [
  "GLITCH σ: paridad rota en registro de tráfico · evidencia admisible podría estar contaminada.",
  "SchreckNet · spoofing de SSID oficial detectado · no confíes en la red que «se siente» estatal.",
  "PARanoia++: vecino anónimo subió clip con tu silueta · hash coincide 62% (margen de ruído urbano).",
] as const;

const TIER_5 = [
  "CRITICAL σ: triangulación activa en Costanera-Mapocho · asumí ojo hasta demostrar apagón real.",
  "SchreckNet · kernel panic simbólico: tres testigos dicen ver tres cosas distintas · ninguna es gratis.",
  "GLITCH TOTAL: tu última ruta aparece en dataset filtrado · borrar local no borra copia ajena.",
] as const;

function pick<T>(xs: readonly T[], h: number, salt: number): T {
  return xs[(Math.abs(h) + salt) % xs.length]!;
}

export function buildSigmaSystemWhispers(sigma: number, seed: number): string[] {
  if (sigma <= 1) return [];
  const h = seed;
  if (sigma === 2) return [pick(TIER_2, h, 0)];
  if (sigma === 3) return [pick(TIER_2, h, 1), pick(TIER_3, h, 2)];
  if (sigma === 4) return [pick(TIER_3, h, 3), pick(TIER_4, h, 4)];
  return [pick(TIER_4, h, 5), pick(TIER_5, h, 6), pick(TIER_2, h, 7)];
}
