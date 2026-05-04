import type { NarrativeEntityBrief, NarrativeEntityKind } from "@/data/knowledge/types";

/** Guía mínima para que el motor / LLM no trate todos los PNJ como Kindred igual de comprometidos. */
export const entities: Record<NarrativeEntityKind, NarrativeEntityBrief> = {
  kindred_established: {
    role: "Kindred anclado redes antiguas · deuda y etiqueta cargan igual que colmillo.",
    defaultHooks: ["prueba de jerarquía", " rumor que te llega antes", "favor tasado antes del abrazo visible"],
  },
  kindred_young: {
    role: "Kindred nuevo en mapa político · improvisa vínculos; el barrio olfatea hambre y error.",
    defaultHooks: ["prueba táctica rápida", "mentor ausente audible", "fama aún reversible"],
  },
  thin_blood: {
    role: "Línea delgada — mortalidad cercana tecnología/alimento que diluye separación clásica.",
    defaultHooks: ["acceso frontera mortal-kindred · fricción institucional", "alibi cotidiano frágil"],
  },
  ghoul: {
    role: "Sangre domestica vínculos — vínculos domestican hambre ajen.",
    defaultHooks: ["lealtad con caducidad física creíble", "conocimiento de cocina vampírica sin don pleno"],
  },
  herd_contact: {
    role: "Rebaño táctico — capa mortal del mapa emotivo vampírico.",
    defaultHooks: ["riesgo reputacional ante Masquerada", "información visceral mortal barata cara en drama"],
  },
  mortal: {
    role: "Mortal rutinaria — consecuencias legales y sensoriales vampíricas sin red de sire.",
    defaultHooks: ["cronología trabajo/sueño mortal", "miedos plausibles y testigos inadvertidos"],
  },
};
