const CHRONICLE_KEY = "cronista-chronicle-v1";
const PENDING_SYNAPTIC_KEY = "cronista-synaptic-pending-v1";

export type ChronicleConfig = {
  /** Cimientos del mundo: cronología, facciones, tabúes. */
  foundations: string;
  AMBIENTE: string;
  TENSION: string;
  ESTADO_GLOBAL: string;
  /** Cómo encajan trama central, subtramas y mesa en vivo (vínculo diegético). */
  VINCULO_HILOS: string;
};

function defaultChronicle(): ChronicleConfig {
  return {
    foundations: "",
    AMBIENTE: "Santiago nocturno, frío seco, neón y concreto, gotic-punk urbano.",
    TENSION: "Inquisición en sombras, operaciones discretas; el Príncipe mantiene apariencia de control.",
    ESTADO_GLOBAL: "Tregua frágil entre linajes; rumores de cazadores en el barrio alto.",
    VINCULO_HILOS: "",
  };
}

/** Génesis en blanco (reset global operador — cada navegador vuelve a plantilla vacía). */
export function blankChronicleForServerReset(): ChronicleConfig {
  return {
    foundations: "",
    AMBIENTE: "",
    TENSION: "",
    ESTADO_GLOBAL: "",
    VINCULO_HILOS: "",
  };
}

export function loadChronicle(): ChronicleConfig {
  if (typeof window === "undefined") return defaultChronicle();
  try {
    const raw = localStorage.getItem(CHRONICLE_KEY);
    if (!raw) return defaultChronicle();
    const p = JSON.parse(raw) as Partial<ChronicleConfig>;
    const d = defaultChronicle();
    return {
      foundations: typeof p.foundations === "string" ? p.foundations : d.foundations,
      AMBIENTE: typeof p.AMBIENTE === "string" ? p.AMBIENTE : d.AMBIENTE,
      TENSION: typeof p.TENSION === "string" ? p.TENSION : d.TENSION,
      ESTADO_GLOBAL: typeof p.ESTADO_GLOBAL === "string" ? p.ESTADO_GLOBAL : d.ESTADO_GLOBAL,
      VINCULO_HILOS: typeof p.VINCULO_HILOS === "string" ? p.VINCULO_HILOS : d.VINCULO_HILOS,
    };
  } catch {
    return defaultChronicle();
  }
}

export function saveChronicle(c: ChronicleConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHRONICLE_KEY, JSON.stringify(c));
}

/** Disrupción pendiente (prioridad narrativa en la próxima llamada IA). */
export function setPendingSynapticDisruption(text: string): void {
  if (typeof window === "undefined") return;
  const t = text.trim();
  if (!t) {
    localStorage.removeItem(PENDING_SYNAPTIC_KEY);
    return;
  }
  localStorage.setItem(PENDING_SYNAPTIC_KEY, t);
}

export function peekPendingSynapticDisruption(): string | null {
  if (typeof window === "undefined") return null;
  const t = localStorage.getItem(PENDING_SYNAPTIC_KEY);
  return t?.trim() ? t.trim() : null;
}

/** Lee y borra (un solo consumo por envío al motor). */
export function consumePendingSynapticDisruption(): string | null {
  const t = peekPendingSynapticDisruption();
  if (t) localStorage.removeItem(PENDING_SYNAPTIC_KEY);
  return t;
}
