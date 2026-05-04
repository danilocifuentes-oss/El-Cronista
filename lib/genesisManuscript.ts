/**
 * Script de Génesis — texto plano → Génesis (chronicle) + mundo Nexo (cliente).
 * Pensado para pegar bloques entre GENESIS_START / GENESIS_END o líneas sueltas KEY: valor.
 */

import type { ChronicleConfig } from "@/lib/chronicleConfig";
import type { MainQuestBeat, NexusWorldState } from "@/lib/nexusWorldState";

export type GenesisCompileResult = {
  chronicle: ChronicleConfig;
  world: NexusWorldState;
  /** Avisos de coherencia (no bloquean guardar). */
  warnings: string[];
  /** Líneas reconocidas (eco de orquestación). */
  log: string[];
};

const MARK = "--- MANUSCRITO_GÉNESIS (compilado) ---\n";

function uid(): string {
  return `ms-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function normKey(line: string): { key: string; value: string } | null {
  const t = line.trim();
  if (!t || t.startsWith("#")) return null;
  const idx = t.indexOf(":");
  if (idx < 1) return null;
  const key = t.slice(0, idx).trim().toUpperCase().replace(/\s+/g, "_");
  const value = t.slice(idx + 1).trim();
  if (!value) return null;
  return { key, value };
}

function stripBlockMarkers(raw: string): string {
  let s = raw.replace(/\r\n/g, "\n");
  const start = /^[\s]*GENESIS_START[\s]*\n/i;
  const end = /\n[\s]*GENESIS_END[\s]*$/i;
  if (start.test(s)) s = s.replace(start, "");
  if (end.test(s)) s = s.replace(end, "");
  return s.trim();
}

function parsePipe(value: string): string[] {
  return value
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean);
}

function extractAntagonistName(value: string): string {
  const parts = parsePipe(value);
  return (parts[0] ?? value).trim();
}

function normalizePhase(s: string): MainQuestBeat["phase"] {
  const x = s.toLowerCase().trim();
  if (x === "activa" || x === "latente" || x === "resuelta" || x === "fallida") return x;
  return "latente";
}

/**
 * Referencia de campos (para ayuda en UI). No es esquema rígido: alias se mapean en compile.
 */
export const GENESIS_MANUSCRIPT_REFERENCE = `
1 · Codex de ambientación: CIUDAD | AMBIENTE | TENSION | ESTADO_GLOBAL | LEY_LOCAL | MASCARADA
2 · Dramatis: PJ o PERSONAJE (línea libre; se anexa al bloque manuscrito)
3 · Arcos: ARCO o HITO o CAPITULO (título | briefing | fase latente|activa|resuelta|fallida | hilo principal|paralela|vivo|cualquiera)
4 · Antagonistas: ANTAGONISTA (nombre | agenda | amenaza 1-5 opcional)
5 · Léxico: ESTILO_NARRATIVO | LEXICO | PROHIBIDO | CRUDEZA
6 · Escena: INTRO_ESCENA | ESCENA_ACTUAL | CONFLICTO | RITMO
7 · Orquestación: AMENAZA_SIGMA | NOTA_CIUDAD
`.trim();

/**
 * Compila texto plano sobre el estado actual (merge no destructivo salvo campos explícitos).
 */
export function compileGenesisManuscript(
  raw: string,
  baseChronicle: ChronicleConfig,
  baseWorld: NexusWorldState,
): GenesisCompileResult {
  const text = stripBlockMarkers(raw);
  const warnings: string[] = [];
  const log: string[] = [];

  let chronicle: ChronicleConfig = { ...baseChronicle };
  let world: NexusWorldState = {
    ...baseWorld,
    mainQuestLine: [...baseWorld.mainQuestLine],
    worldFlags: [...baseWorld.worldFlags],
  };

  const manuscriptSections: string[] = [];
  const antagonistNames: string[] = [];
  let sceneBlob = "";
  let sigmaHint: number | null = null;

  const lines = text.split("\n").map((l) => l.trim());

  for (const line of lines) {
    const kv = normKey(line);
    if (!kv) continue;
    const { key, value } = kv;

    switch (key) {
      case "CIUDAD":
      case "UBICACION":
      case "UBICACIÓN":
        world.eraLabel = value.slice(0, 280);
        manuscriptSections.unshift(`Ubicación ancla: ${value}`);
        log.push("CIUDAD → eraLabel + manuscrito");
        break;
      case "AMBIENTE":
        chronicle.AMBIENTE = value.slice(0, 4000);
        log.push("AMBIENTE");
        break;
      case "TENSION":
      case "TENSIÓN":
        chronicle.TENSION = value.slice(0, 4000);
        log.push("TENSION");
        break;
      case "ESTADO_GLOBAL":
      case "ESTADO_MUNDIAL":
        chronicle.ESTADO_GLOBAL = value.slice(0, 4000);
        log.push("ESTADO_GLOBAL");
        break;
      case "LEY_LOCAL":
        chronicle.foundations = `${chronicle.foundations.trim()}\n\n· Ley local: ${value}`.trim().slice(0, 12000);
        log.push("LEY_LOCAL → foundations");
        break;
      case "MASCARADA":
      case "NIVEL_MASCARADA":
        manuscriptSections.push(`Mascarada: ${value}`);
        log.push("MASCARADA → manuscrito");
        break;
      case "PJ":
      case "PJ_1":
      case "PJ_2":
      case "PERSONAJE":
      case "DRAMATIS":
        manuscriptSections.push(`${key}: ${value}`);
        log.push(`${key} → dramatis`);
        break;
      case "ARCO":
      case "ARCO_A":
      case "ARCO_B":
      case "HITO":
      case "CAPITULO":
      case "CAPÍTULO": {
        const parts = parsePipe(value);
        const title = (parts[0] ?? value).slice(0, 120);
        const briefing = (parts[1] ?? "").slice(0, 900);
        const phase = normalizePhase(parts[2] ?? "latente");
        const strandRaw = (parts[3] ?? "cualquiera").toLowerCase();
        const strandHint =
          strandRaw === "principal" || strandRaw === "paralela" || strandRaw === "vivo" ? strandRaw : "cualquiera";
        if (title) {
          world.mainQuestLine.push({
            id: uid(),
            title,
            briefing: briefing || title,
            phase,
            strandHint,
          });
          log.push(`${key} → arco «${title}»`);
        }
        break;
      }
      case "ARCO_ACTUAL":
        world.lastBeat = [value.trim(), world.lastBeat].filter(Boolean).join(" · ").slice(0, 2000);
        log.push("ARCO_ACTUAL → lastBeat");
        break;
      case "ANTAGONISTA": {
        const name = extractAntagonistName(value);
        if (name.length >= 2) antagonistNames.push(name);
        world.worldFlags.push(`Antagonista: ${value.slice(0, 200)}`);
        if (world.worldFlags.length > 22) world.worldFlags = world.worldFlags.slice(-22);
        log.push(`ANTAGONISTA → ${name}`);
        break;
      }
      case "ESTILO_NARRATIVO":
      case "ESTILO":
      case "LEXICO":
      case "LÉXICO":
        manuscriptSections.push(`Estilo / léxico: ${value}`);
        log.push("ESTILO");
        break;
      case "PROHIBIDO":
        manuscriptSections.push(`Términos a evitar: ${value}`);
        break;
      case "CRUDEZA":
        manuscriptSections.push(`Crudeza: ${value}`);
        break;
      case "INTRO_ESCENA":
      case "ESCENA_ACTUAL":
      case "CONFLICTO":
      case "RITMO":
        sceneBlob = `${sceneBlob} ${key}: ${value}`.trim();
        chronicle.VINCULO_HILOS = [chronicle.VINCULO_HILOS.trim(), `${key}: ${value}`]
          .filter(Boolean)
          .join("\n")
          .slice(0, 8000);
        log.push(key);
        break;
      case "AMENAZA_SIGMA":
      case "SIGMA":
      case "AMENAZA_Σ": {
        const n = parseInt(value.replace(/\D/g, "").slice(0, 1), 10);
        if (!Number.isNaN(n) && n >= 0 && n <= 5) {
          sigmaHint = n;
          world.worldFlags.push(`σ mesa (manuscrito): ${n}`);
          chronicle.ESTADO_GLOBAL = `${chronicle.ESTADO_GLOBAL.trim()}\n\n· Amenaza Σ registrada en manuscrito: ${n}.`.trim().slice(0, 4000);
          log.push(`AMENAZA_SIGMA → ${n}`);
        }
        break;
      }
      case "NOTA_CIUDAD":
        world.worldFlags.push(value.slice(0, 120));
        if (world.worldFlags.length > 22) world.worldFlags = world.worldFlags.slice(-22);
        log.push("NOTA_CIUDAD");
        break;
      case "CIMIENTOS":
      case "FOUNDATIONS":
        chronicle.foundations = value.slice(0, 12000);
        log.push("CIMIENTOS");
        break;
      case "VINCULO_HILOS":
      case "VÍNCULO_HILOS":
        chronicle.VINCULO_HILOS = value.slice(0, 8000);
        log.push("VINCULO_HILOS");
        break;
      default:
        manuscriptSections.push(`${key}: ${value}`);
        log.push(`(libre) ${key}`);
    }
  }

  if (manuscriptSections.length) {
    const block = manuscriptSections.join("\n");
    const baseFound = chronicle.foundations.includes(MARK)
      ? chronicle.foundations.split(MARK)[0]?.trimEnd() ?? ""
      : chronicle.foundations.trimEnd();
    chronicle.foundations = `${baseFound}\n\n${MARK}${block}`.trim().slice(0, 12000);
  }

  const sceneLower = sceneBlob.toLowerCase();
  for (const name of antagonistNames) {
    if (name.length < 3) continue;
    if (sceneBlob && !sceneLower.includes(name.toLowerCase())) {
      warnings.push(
        `Coherencia: la escena sembrada no menciona al antagonista «${name}» — revisá INTRO_ESCENA / CONFLICTO o el nombre.`,
      );
    }
  }

  if (sceneBlob && antagonistNames.length === 0) {
    warnings.push("La escena define conflicto pero no hay líneas ANTAGONISTA: — conviene nombrar oposición explícita.");
  }

  if (sigmaHint !== null) {
    warnings.push(
      `σ=${sigmaHint} quedó anotada en Génesis / marcas; el contador de mesa en el Nexo sigue siendo local del cliente hasta que el MJ lo suba en consola.`,
    );
  }

  world.updatedAt = Date.now();
  return { chronicle, world, warnings, log };
}

export const GENESIS_MANUSCRIPT_EXAMPLE = `GENESIS_START
CIUDAD: Santiago, Beauchef. Niebla ácida bajo el neón.
AMBIENTE: Post-estallido; militarización de la periferia; tregua de Camarilla tensa.
TENSION: Inquisición en sombras; drones baratos en techos.
ESTADO_GLOBAL: Rumores de laboratorio sellado; el Príncipe niega todo.
LEY_LOCAL: Nadie habla del río Mapocho después de medianoche.
PJ_1: Ana | CLAN: Malkavian | PECADO: Curiosidad | MOTIVACION: Probar que la ciudad miente.
ARCO: El laboratorio sellado | El rumor llega al barón; los PJ deben elegir bando | latente | principal
ANTAGONISTA: Dra. Varela | agenda: protocolo de silencio | 4
ESTILO_NARRATIVO: Gótico-químico, termodinámica, cinismo seco.
INTRO_ESCENA: Despiertan en celda húmeda; olor a ozono. Dra. Varela observa tras el vidrio.
CONFLICTO: Escapar sin quemar la Mascarada.
RITMO: Tenso
AMENAZA_SIGMA: 2
GENESIS_END`;
