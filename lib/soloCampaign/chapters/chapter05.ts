import type { SoloChapter } from "@/lib/soloCampaign/types";

export const chapter05: SoloChapter = {
  id: "chapter05",
  title: "Santiago en Cenizas · Capítulo 5 · Entre el Neón y la Barricada",
  description:
    "Plaza Italia en ebullición: hambre en multitud, cámaras, y un anarquista que huele a incendio contenido.",
  startSceneId: "n5_1",
  scenes: [
    {
      id: "n5_1",
      chapterId: "chapter05",
      title: "5.1 · Plaza Italia",
      text: `Me encontraba en la intersección de la Alameda con Vicuña Mackenna. La Plaza Italia era un hervidero de furia humana.

Caminar entre miles de humanos excitados es como caminar por una bodega de pólvora con una cerilla encendida.`,
      options: [
        {
          id: "n5_1_keep_mask",
          type: "dialogue",
          text: "Mantenerme bajo máscara. No es noche para llamar la atención.",
          requirement: { type: "none" },
          nextSceneId: "n5_2",
          effects: [{ type: "setFlag", flag: "novel_ch5_mask" }],
        },
        {
          id: "n5_1_feed_risk",
          type: "dialogue",
          text: "Aprovechar el caos para alimentarme rápido (arriesgando el secreto).",
          requirement: { type: "none" },
          nextSceneId: "n5_2",
          effects: [{ type: "hungerDelta", delta: -1 }, { type: "humanityDelta", delta: -1 }, { type: "setFlag", flag: "novel_ch5_risky_feed" }],
        },
      ],
    },
    {
      id: "n5_2",
      chapterId: "chapter05",
      title: "5.2 · Gato",
      text: `—No lo hagas, cachorro. Esa sangre sabe a rabia y lacrimógena.

Apoyado contra una pared cubierta de grafitis, vi a un hombre con capucha negra y una máscara de gas colgando del cuello. Sus ojos brillaban con una vitalidad que no era humana.

—Me llaman Gato —dijo—.`,
      options: [
        {
          id: "n5_2_listen",
          type: "dialogue",
          text: "Escuchar. En esta calle, la información cuesta menos que la sangre.",
          requirement: { type: "none" },
          nextSceneId: "n5_3",
          effects: [{ type: "setFlag", flag: "novel_ch5_met_gato" }],
        },
        {
          id: "n5_2_presence",
          type: "discipline",
          discipline: "presence",
          disciplineTitle: "Fuego contenido",
          text: "Mostrar que no soy un juguete del centro: si me necesita, que lo diga.",
          requirement: { type: "discipline", discipline: "presence", minLevel: 1 },
          nextSceneId: "n5_3",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch5_presence_gato" }],
        },
      ],
    },
    {
      id: "n5_3",
      chapterId: "chapter05",
      title: "5.3 · La decisión en el humo",
      text: `Entre el humo vi a una joven caída. Uno de esos seres pálidos se cernía sobre ella. No iba a beber con delicadeza: iba a despedazarla.

Podía dejar que la ciudad ardiera. O podía actuar.`,
      options: [
        {
          id: "n5_3_intervene",
          type: "dialogue",
          text: "Intervenir y salvarla (arriesgando exponerte).",
          requirement: { type: "none" },
          nextSceneId: "n5_end",
          effects: [{ type: "humanityDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch5_saved_student" }],
        },
        {
          id: "n5_3_stay_hidden",
          type: "dialogue",
          text: "No intervenir. Sobrevivir y mantener el secreto.",
          requirement: { type: "none" },
          nextSceneId: "n5_end",
          effects: [{ type: "humanityDelta", delta: -1 }, { type: "setFlag", flag: "novel_ch5_let_burn" }],
        },
      ],
    },
    {
      id: "n5_end",
      chapterId: "chapter05",
      title: "5.E · Neón y ceniza",
      text: `Esa noche, bajo las luces de neón y el fuego de la Alameda, comprendí que ser lo que soy aquí no era una maldición literaria.

Era una guerra de guerrillas eterna por defender la poca decencia que aún me cabía en el pecho frío.`,
      options: [
        {
          id: "n5_end_continue",
          type: "dialogue",
          text: "Continuar al Capítulo 6",
          requirement: { type: "none" },
          nextSceneId: "n5_end",
          effects: [{ type: "setFlag", flag: "chapter_pending_chapter06" }],
        },
      ],
    },
  ],
};
