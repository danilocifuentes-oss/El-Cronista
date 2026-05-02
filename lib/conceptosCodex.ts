/**
 * Plantillas de concepto CODEX (mesa · no canónico oficial).
 * Nombre en ficha + descripción para tooltip en creación.
 */

export type ConceptoCodexRow = {
  /** Clave estable para JSON / `conceptPresetId`. */
  id: string;
  nombre: string;
  descripcion: string;
};

export const CONCEPT_SELECT_CUSTOM = "__custom__" as const;

export const CONCEPTOS_DATA: ConceptoCodexRow[] = [
  {
    id: "periodista_ceniza",
    nombre: "Periodista ceniza",
    descripcion:
      "Cronista de hechos que no pasan el arbitraje editorial; persigue titulares sepultados por el Príncipe o la camarilla.",
  },
  {
    id: "ejecutivo_umbral",
    nombre: "Ejecutivo del umbral",
    descripcion:
      "Máscara de KPIs y reuniones mientras negocia favores que solo existen después del ascensor y del anochecer.",
  },
  {
    id: "cazador_interno",
    nombre: "Cazador interno",
    descripcion:
      "Ya no puede dejar ir al monstruo: vigila vampiros porque conoce el precio cotidiano de sobrevivir entre ellos.",
  },
  {
    id: "voz_barricada",
    nombre: "Voz en la barricada",
    descripcion:
      "Manifiestos, megáfono y cicatrices públicas hasta que algún día arda la ciudad tolerable.",
  },
  {
    id: "cirujano_circadiano",
    nombre: "Cirujano circadiano",
    descripcion:
      "Salas donde el turno coincide con pulsos raros; la hemoglobina llega cuando el reloj se niega.",
  },
  {
    id: "curador_ficciones",
    nombre: "Curador de ficciones",
    descripcion:
      "Galerías, piezas perdidas y mecenas sangrantes: vende narrativas que otros linajes necesitan olvidar.",
  },
  {
    id: "neon_subterraneo",
    nombre: "Neón subterráneo",
    descripcion:
      "Pasillos y club donde el BPM marca frontera; el humano viene de turismo pero el pacto está en efectivo.",
  },
  {
    id: "archivista_ilegal",
    nombre: "Archivista ilegal",
    descripcion:
      "Microfichas, cintas corruptas y memorias fotográficas: archiva pecados porque el sistema los borró.",
  },
  {
    id: "chauffeur_fantasma",
    nombre: "Chófer fantasma",
    descripcion:
      "Rutas bifurcan cuando el GPS dice una cosa y el instinto predatorio otra; el pasajero paga más que tarifa.",
  },
  {
    id: "monja_dudosa",
    nombre: "Monja dudosa",
    descripcion:
      "Institución clerical endurecida; la confesión ya no sirve igual cuando el perdón tiene colmillos.",
  },
  {
    id: "soldado_fuera_caja",
    nombre: "Soldado fuera de caja",
    descripcion:
      "Sin guerra oficial porque todas fueron declaradas después de medianoche; patrulla fallas del covenant.",
  },
  {
    id: "figura_tarima",
    nombre: "Figura de tarima fugaz",
    descripcion:
      "Fama frágil ante el público mortal; cuenta regresiva hasta que el rumor del linaje llegue backstage.",
  },
  {
    id: "broker_sombras",
    nombre: "Broker de sombras",
    descripcion:
      "Liquidez y favores canjeables antes del ocaso mercantil; el crédito se liquida en mano tendida vampírica.",
  },
  {
    id: "mediador_frio",
    nombre: "Mediador frío",
    descripcion:
      "Traduce pactos donde humanos pagan con destinos fragmentados linaje arriba mira cómo se ejecuta.",
  },
  {
    id: "genealogista_cain",
    nombre: "Genealogista de Cain",
    descripcion:
      "Árboles de sangre porque el sire no perdona genealogías incompletas; cada rama cuenta traición elegible.",
  },
];

export function inferConceptPresetIdFromNombre(nombre: string): string | null {
  const t = nombre.trim();
  const row = CONCEPTOS_DATA.find((c) => c.nombre === t);
  return row?.id ?? null;
}

export function conceptoById(id: string): ConceptoCodexRow | undefined {
  return CONCEPTOS_DATA.find((c) => c.id === id);
}
