import type { SoloChapter } from "@/lib/soloCampaign/types";

/** Narración en segunda persona. */
export const chapter10: SoloChapter = {
  id: "chapter10",
  title: "Santiago en Cenizas · Capítulo 10 · La Cacería Salvaje",
  description:
    "La estación convertida en matadero: Sabat en abierto, compulsión del Vínculo y un ojo que se abre en la cripta.",
  startSceneId: "n10_1",
  scenes: [
    {
      id: "n10_1",
      chapterId: "chapter10",
      title: "10.1 · Olor a cacería",
      text: `Santiago no duerme, pero esa noche parecía estar en coma. Sirenas, cristales rotos y un olor que ningún humano sabría identificar: el olor de la Cacería Salvaje.`,
      options: [
        {
          id: "n10_1_go",
          type: "dialogue",
          text: "Ir a la Estación Mapocho.",
          requirement: { type: "none" },
          nextSceneId: "n10_2",
          effects: [{ type: "setFlag", flag: "novel_ch10_to_station" }],
        },
        {
          id: "n10_1_hold",
          type: "dialogue",
          text: "Demorar un minuto (el cuerpo tiembla por miedo al fuego).",
          requirement: { type: "none" },
          nextSceneId: "n10_2",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch10_fear" }],
        },
      ],
    },
    {
      id: "n10_2",
      chapterId: "chapter10",
      title: "10.2 · Matadero",
      text: `La Estación Mapocho era un matadero. Cuerpos colgando. Antorchas. Figuras pálidas deformadas por el uso abyecto de la sangre.\n\nEl Sabat había dejado de esconderse.`,
      options: [
        {
          id: "n10_2_enter",
          type: "dialogue",
          text: "Bajar al túnel. Si despiertan lo que hay ahí, la ciudad arde.",
          requirement: { type: "none" },
          nextSceneId: "n10_3",
          effects: [{ type: "setFlag", flag: "novel_ch10_enter_tunnel" }],
        },
        {
          id: "n10_2_bond_pull",
          type: "dialogue",
          text: "Sentir el tirón del Vínculo y pelear contra mi propio cuerpo.",
          requirement: { type: "none" },
          nextSceneId: "n10_3",
          effects: [{ type: "humanityDelta", delta: -1 }, { type: "setFlag", flag: "novel_ch10_bond_pull" }],
        },
      ],
    },
    {
      id: "n10_3",
      chapterId: "chapter10",
      title: "10.3 · Cripta",
      text: `El suelo se abre ante ti: una cripta de piedra negra. El líder tatuado sostiene una estaca sobre el ataúd.\n\nLa tapa cede.\n\nNo ves brotar una bestia de colmillos; lo que sale es un suspiro. Un frío que vuelve las llamas azules.\n\nSantiago, metáfora viva sobre tablado de humo, parece abrir un ojo demasiado viejo; ese parpadeo te hiela la nuca como advertencia sin traducción.`,
      options: [
        {
          id: "n10_3_run",
          type: "dialogue",
          text: "Huir. No es una pelea que pueda ganar.",
          requirement: { type: "none" },
          nextSceneId: "n10_end",
          effects: [{ type: "setFlag", flag: "novel_ch10_run" }],
        },
        {
          id: "n10_3_stay",
          type: "dialogue",
          text: "Quedarme un segundo más y mirar el abismo (y pagar ese segundo).",
          requirement: { type: "none" },
          nextSceneId: "n10_end",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "novel_ch10_stare" }],
        },
      ],
    },
    {
      id: "n10_end",
      chapterId: "chapter10",
      title: "10.E · El despertar comenzó",
      text: `La Cacería Salvaje terminó, pero el despertar había comenzado.`,
      options: [
        {
          id: "n10_end_continue",
          type: "dialogue",
          text: "Continuar al Capítulo 11",
          requirement: { type: "none" },
          nextSceneId: "n10_end",
          effects: [{ type: "setFlag", flag: "chapter_pending_chapter11" }],
        },
      ],
    },
  ],
};
