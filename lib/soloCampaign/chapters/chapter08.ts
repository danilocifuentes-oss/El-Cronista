import type { SoloChapter } from "@/lib/soloCampaign/types";

export const chapter08: SoloChapter = {
  id: "chapter08",
  title: "Santiago en Cenizas · Capítulo 8 · El Santuario Profanado",
  description:
    "Teatinos arde: un refugio marcado, un sabático tatuado y la certeza de que ya no existe neutralidad.",
  startSceneId: "n8_1",
  scenes: [
    {
      id: "n8_1",
      chapterId: "chapter08",
      title: "8.1 · Teatinos · Umbral cruzado",
      text: `Regresé a mi refugio en la imprenta buscando el único consuelo que nos queda: el silencio del suelo. Pero el aire, incluso antes de cruzar el umbral, se sentía distinto.

Sangre fresca. Y no era la mía.`,
      options: [
        {
          id: "n8_1_enter",
          type: "dialogue",
          text: "Entrar con cuidado. La prisa es el primer paso hacia la muerte definitiva.",
          requirement: { type: "none" },
          nextSceneId: "n8_2",
          effects: [{ type: "setFlag", flag: "novel_ch8_enter_refuge" }],
        },
        {
          id: "n8_1_auspex",
          type: "discipline",
          discipline: "auspex",
          disciplineTitle: "Tap. Tap. Tap.",
          text: "Abrir Auspex: oír el goteo rítmico antes de ver el caos.",
          requirement: { type: "discipline", discipline: "auspex", minLevel: 1 },
          nextSceneId: "n8_2",
          effects: [{ type: "setFlag", flag: "novel_ch8_auspex_drip" }],
        },
      ],
    },
    {
      id: "n8_2",
      chapterId: "chapter08",
      title: "8.2 · La sombra tatuada",
      text: `El caos era total. Sobre la mesa, un cuerpo dispuesto con una simetría aterradora. En la pared, escrito con sangre: “LA MASCARADA ES LA JAULA. NOSOTROS SOMOS LA LLAVE”.

—No deberías haber aceptado esa copa, diplomático —dijo una voz desde arriba.

La silueta cayó con gracia de gato. Piel pálida. Tatuajes vivos. Sonrisa de siglos.`,
      options: [
        {
          id: "n8_2_fight",
          type: "dialogue",
          text: "Pelear. No negociar con carniceros.",
          requirement: { type: "none" },
          nextSceneId: "n8_end",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch8_fight" }],
        },
        {
          id: "n8_2_celerity_like",
          type: "dialogue",
          text: "Moverme antes de que me alcance (la sangre vieja me empuja).",
          requirement: { type: "none" },
          nextSceneId: "n8_end",
          effects: [{ type: "setFlag", flag: "novel_ch8_dodge" }],
        },
      ],
    },
    {
      id: "n8_end",
      chapterId: "chapter08",
      title: "8.E · Cenizas",
      text: `Salí de la imprenta justo antes de que el fuego consumiera lo último que me quedaba de mi vida anterior.

—Han marcado tu refugio —dijo Gato—. Ya no puedes esconderte en los libros.`,
      options: [
        {
          id: "n8_end_continue",
          type: "dialogue",
          text: "Continuar al Capítulo 9",
          requirement: { type: "none" },
          nextSceneId: "n8_end",
          effects: [{ type: "setFlag", flag: "chapter_pending_chapter09" }],
        },
      ],
    },
  ],
};
