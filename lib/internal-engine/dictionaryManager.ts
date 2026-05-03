import type { ClanId } from "@/lib/character";
import type { NexoIntent } from "@/lib/internal-engine/classifyIntent";

export type LexProfile = {
  clanId: ClanId | null;
  hambre: number;
  sigma: number;
};

function pick<T>(xs: readonly T[], h: number, salt: number): T {
  return xs[(Math.abs(h) + salt) % xs.length]!;
}

/** Hitos Santiago — descriptores gótico-punk / SchreckNet. */
export const SANTIAGO_NEXO_SITES: readonly {
  id: string;
  lines: readonly string[];
}[] = [
  {
    id: "beauchef",
    lines: [
      "Beauchef huele a solvente barato y a teoría que no paga alquiler: cables colgando como tripas de edificio que aún cree ser futuro.",
      "El campus derrama luz fría sobre veredas donde el silencio no es inocencia sino contrato pendiente.",
    ],
  },
  {
    id: "mapocho",
    lines: [
      "El Mapocho lleva reflejos de neón enfermo; el agua negra anuncia cadáveres de juguetes y de promesas políticas.",
      "Río urbano: memoria húmeda que arrastra etiquetas arrancadas y olor a metal barato con remordimiento.",
    ],
  },
  {
    id: "plaza_italia",
    lines: [
      "Plaza Italia es olla a presión de banderas y spray: cada muralla grita ideología mientras abajo alguien vende hambre con descuento.",
      "Círculo de protesta y turismo roto: acá la ciudad muestra diente sin anestesia.",
    ],
  },
  {
    id: "costanera",
    lines: [
      "La Costanera alzada es insulto de vidrio contra el cerro; arriba, luces de oficina que nunca duermen del todo.",
      "Torre de antenas disfrazada de shopping: el aire fino no tapa el sudor ni el miedo a miradas desde arriba.",
    ],
  },
];

const MALKAVIAN_PHYSICS_LEX: readonly string[] = [
  "La calle superpone estados hasta colapsar en un olor que no es solo olor: es interferencia entre luces.",
  "Tu sombra hace tunelamiento donde no debería haber túnel; el paso siguiente bifurca sin pedir permiso.",
  "Sinestesia del cableado: el zumbido sabe a cobre frío y el rojo del semáforo suena a advertencia tardía.",
  "Decoherencia social: las caras pierden fase y reaparecen desfasadas medio latido después.",
  "Entrelazamiento espurio: dos rumores distintos comparten el mismo bit de miedo en esta esquina.",
];

function maybeSantiagoInjection(profile: LexProfile, intent: NexoIntent, h: number): string {
  if (!["move", "localization", "ambient", "survival_probe"].includes(intent)) return "";
  const bias = profile.sigma * 0.04 + (profile.hambre > 2 ? 0.06 : 0);
  if ((Math.abs(h) % 100) / 100 > 0.35 + bias) return "";
  const site = pick(SANTIAGO_NEXO_SITES, h, 2);
  return pick(site.lines, h, 5);
}

const AMBIENT: Record<NexoIntent, readonly string[]> = {
  greeting: [
    "Canal SchreckNet: eco húmedo en vidrios que nadie limpió desde el último verano político.",
    "Neón enfermo y aire a condicionador quemado — la ciudad te lee antes de que envíes.",
  ],
  survival_probe: [
    "Santiago no reparte víveres: negocia rutas donde la cámara tiene catarata y el olor miente menos que la gente.",
    "Cada refugio tiene dueño deudor; cada grifo tiene testigo anónimo archivando tu sed.",
  ],
  localization: [
    "Coordenadas sucias: el mapa oficial es propaganda; el tuyo se escribe con miedo y olores.",
    "Pedir dónde es filtrar quién debe enterarse de que estás en camino.",
  ],
  examine: [
    "Registro táctil: polvo demasiado limpio, silencio negociado, latencia entre lo visto y lo conveniente.",
    "La mirada forense pide tiempo que la calle cobra con interés.",
  ],
  move: [
    "Desplazamiento urbano: el pavimento actualiza firmware de paranoia a cada manzana.",
    "Zancada y sombra: la ciudad reescribe el clip antes de que llegues al corte.",
  ],
  social: [
    "Interfaz social: cada frase es handshake envenenado; el protocolo oculta dientes.",
    "Etiqueta y filo comparten buffer; la compostura es exploit caro.",
  ],
  violence: [
    "Buffer de violencia: el cuerpo escribe en memoria antes que el manual permita borrar.",
    "Roce metálico en el aire — la escena compila daño sin pedir build limpio.",
  ],
  flee: [
    "Fuga: rutas paralelas compiten hasta que una queda como única salida corrupta.",
    "La ciudad archiva huellas como deudas mal liquidadas.",
  ],
  magic: [
    "Don online: permisos elevados en realidad; sombras con PID sospechoso.",
    "Ozono y reglas torcidas — el entorno hace garbage collection de tu inocencia.",
  ],
  ambient: [
    "Subrutina nocturna: radios en bucle, tuberías que cantan bajo y neón que agoniza.",
    "Humedad y cables: la ciudad es servidor oxidado con uptime demasiado alto.",
  ],
};

const ACTION_CORE: Record<NexoIntent, readonly string[]> = {
  greeting: [
    "Tu saludo queda en cola de paquetes: alguien lo escucha antes de que decidas destinatario.",
    "Formalidad mínima; el barrio responde con silencio que ya incluye juicio.",
  ],
  survival_probe: [
    "Priorizás agua, techo o rumor barato — los tres compiten en la misma tabla de enrutamiento.",
    "El cuerpo pide víveres; la Sangre pide otra cosa y ambas firman en la misma línea de tiempo.",
  ],
  localization: [
    "Trazás vector desde hito real o inventás uno: sin ancla, la ciudad te asigna testigos default.",
    "Metro, pasillo de servicio o vereda lateral — cada topología cambia el tipo de fuga plausible.",
  ],
  examine: [
    "Afirmás lectura fina: lo que no cuadra aparece como latencia, no como objeto.",
    "El detalle incorrecto es puerta trasera; lo demás es UI bonita.",
  ],
  move: [
    "Caminar por Santiago es negociar ángulos de cámara y olores industriales que mienten con convicción.",
    "Cada esquina es branch: elegís sombra larga o exposición corta.",
  ],
  social: [
    "Palabras como paquetes firmados: quien firma primero arrastra el handshake.",
    "La máscara social mantiene uptime; abajo corre proceso hambriento.",
  ],
  violence: [
    "El gesto ya cargó payload; ahora el entorno decide checksum de sangre o silencio.",
    "Codo y distancia: la escena hace merge sin commit limpio.",
  ],
  flee: [
    "Priorizás salida sobre estética: olor a orina vieja a veces es túnel cifrado.",
    "Dos pasos de más y el rumor te alcanza; dos de menos y quedás expuesto en el diff.",
  ],
  magic: [
    "El poder estira buffers perceptivos hasta leak de secreto ajeno.",
    "Disciplina como exploit: dejás rastro en logs que no son tuyos.",
  ],
  ambient: [
    "Nada explícito: la ciudad hace polling de amenazas y vos quedás en la cola.",
    "Goteras, neumáticos húmedos, radios que repiten el mismo bucle como aviso estúpido y cierto.",
  ],
};

const CLAN_FILTER: Record<ClanId, readonly string[]> = {
  ventrue: [
    "Lente Ventrue: acuerdos, espacios de poder y deuda simbólica en cada gesto cortés.",
    "El aire correcto cuesta; vos ya sabés quién paga el servidor.",
  ],
  nosferatu: [
    "Lente Nosferatu: conductos, humedad, rutas que el mapa limpio niega con vergüenza.",
    "La ciudad real vive bajo la ciudad postal.",
  ],
  brujah: [
    "Lente Brujah: chispa en el cable — la injusticia se siente como latencia acumulada.",
    "El pavimento pide excusa y vos sabés que mentiría.",
  ],
  toreador: [
    "Lente Toreador: detalle cruel en lo bello; el neón sangra estética hasta lastimar.",
    "Cada reflejo es frame que podría ser evidencia o arte, según quién mire.",
  ],
  malkavian: MALKAVIAN_PHYSICS_LEX,
  gangrel: [
    "Lente Gangrel: olor a piel mojada, cordillera lejana como testigo frío, instinto que no pide permiso.",
    "La calle es hábitat; el tráfico es ruido de manada.",
  ],
  tremere: [
    "Lente Tremere: diagramas invisibles, sangre como licencia y precio al mismo tiempo.",
    "Cada sombra parece anotar variables que no deberías poder leer.",
  ],
  thin_blood: [
    "Lente thin-blood: glitch en la herencia — la ciudad te lee humano hasta que deja de convenir.",
    "Mitad señales, mitad ruido: sobrevivís en el margen entre protocolos.",
  ],
  caitiff: [
    "Lente Caitiff: sin marca noble, cada esquina es prompt injection contra tu identidad.",
    "Armas improvisadas: etiqueta, miedo y velocidad.",
  ],
  other: [
    "Linaje indeterminado: la ciudad no te regala arquetipo; te cobra ambigüedad como deuda.",
    "Sin escudo de clan, cada mirada es pentest social.",
  ],
};

const CONSEQUENCE: readonly string[] = [
  "σ baja: el rumor corre lento; aún podés editar la escena antes del commit final.",
  "σ media: patrullas fantasma y apps de vecinos compiten por quién filma primero.",
  "σ alta: drones baratos y doctrina portátil — la paranoia es feature, no bug.",
  "σ extrema: cada sombra parece suscripción activa a un ojo que no pediste.",
  "El siguiente tick exige decisión táctica, no cosmética: quién mira, quién graba, quién cobra.",
];

export const DictionaryManager = {
  prefijoAmbiente(intent: NexoIntent, profile: LexProfile, h: number): string {
    let s = pick(AMBIENT[intent], h, 0);
    if (profile.sigma >= 4) s = `${s} // checksum urbano: FAIL`;
    const st = maybeSantiagoInjection(profile, intent, h + 17);
    if (st) s = `${s}\n\n${st}`;
    return s;
  },

  accionProcesada(intent: NexoIntent, profile: LexProfile, playerAction: string, h: number): string {
    const core = pick(ACTION_CORE[intent], h, 7);
    const clip = playerAction.trim().slice(0, 160);
    const echo = clip ? `\nAcción declarada: «${clip}»` : "";
    let out = `${core}${echo}`;
    if (profile.hambre > 3) {
      out = `${out}\n\n(Hambre: el texto del cuerpo pide cierre rápido — no dilates.)`;
    }
    return out;
  },

  filtroClan(clanId: ClanId | null, h: number): string {
    const key = clanId ?? "other";
    return pick(CLAN_FILTER[key] ?? CLAN_FILTER.other, h, 13);
  },

  consecuenciaEstado(sigma: number, h: number): string {
    const idx = Math.min(CONSEQUENCE.length - 1, Math.max(0, Math.floor(sigma + (h % 3) * 0.25)));
    let s = CONSEQUENCE[idx]!;
    if (sigma >= 4) s += "\n\nParanoia útil: asumí cámara hasta demostrar lo contrario.";
    if (sigma >= 5) s += "\nGlitch administrativo: tres señales no alinean — alguien miente en el stack.";
    return s;
  },
};
