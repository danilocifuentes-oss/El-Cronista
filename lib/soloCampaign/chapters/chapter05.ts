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
      text: `Ese tramo entre la Alameda y Vicuña Mackenna rezumaba adrenalina corrida como corriente. La Plaza Italia hervía de furia humana.

Meterse entre miles de cuerpos excitados equivalía a orillar un depósito de pólvora con fuego cercano.`,
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
      text: `—No lo hagas, cachorro. Esa sangre sabe a rabia y lacrimógeno.

Contra grafitis en capas, otro volumen observaba desde la sombra —capucha negra, máscara de gas pendiente como joya colgante; los ojos llevaban un brío que nadie mortal factura después de medianoche adulta.

—Me llaman Gato —dejó escapar.`,
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
      text: `Entre jirones de humo, una joven yacía en tierra empapada en gas; uno de los pálidos se alzaba encima ya sin intenciones delicadas —planeaba hacer un espectáculo sangriento entre tantos smartphones apuntando al cielo.

Las balas quedaban muy lejos: la escena esperaba sólo decisión.`,
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
      text: `Bajo luces neón rasgadas y fuego contenido contra el pavimento comprendió: ser lo que la noche obligaba no equivalía proverbio gótico.

Era guerrilla interminable en defensa residual de esa decencia diminuta que sobrevive en torso ya helado.`,
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
