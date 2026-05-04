import type { SoloChapter } from "@/lib/soloCampaign/types";

export const chapter01: SoloChapter = {
  id: "chapter01",
  title: "Cenizas en la lluvia · Capítulo 1",
  description: "El primer latido (Brujah): apertura narrativa y decisiones iniciales de supervivencia.",
  startSceneId: "ch1_1",
  scenes: [
    {
      id: "ch1_1",
      chapterId: "chapter01",
      title: "1.1 · El despertar",
      text: `La lluvia cae con violencia sobre Santiago, como si el cielo quisiera apagar un pecado que acaba de nacer.

Abres los ojos en un sótano oscuro y húmedo de Ñuñoa. El olor a concreto mojado, sangre vieja y cables quemados te invade las fosas nasales.

Tu corazón no late.

La rabia llega antes que cualquier otra cosa: una furia caliente, primitiva, que te hace apretar los puños hasta que sientes cómo se rompen las uñas contra las palmas. La Bestia ya está despierta y gruñe dentro de tu pecho como un motor viejo y cabreado.

Lo último que recuerdas es una cara sonriente en la oscuridad y una voz ronca que te dijo:
"Bienvenido al club, cabrón. Ahora eres inmortal… si sobrevives la primera noche."

Te levantas con dificultad. Tus nudillos sangran, pero el dolor se siente lejano, casi placentero.`,
      clanFlavor: {
        brujah: "No pides permiso: decides cuánto daño dejar en pie antes de salir.",
      },
      options: [
        {
          id: "ch1_1_a",
          type: "dialogue",
          text: "Golpear la pared con toda tu rabia hasta sangrar",
          requirement: { type: "none" },
          nextSceneId: "ch1_2",
          effects: [
            { type: "hungerDelta", delta: 2 },
            { type: "humanityDelta", delta: -1 },
            { type: "setFlag", flag: "bru_1_1_pared" },
          ],
        },
        {
          id: "ch1_1_b",
          type: "dialogue",
          text: "Buscar algo útil en el sótano (arma improvisada, salida, pistas)",
          requirement: { type: "none" },
          nextSceneId: "ch1_3",
          effects: [{ type: "setFlag", flag: "bru_1_1_arma" }],
        },
        {
          id: "ch1_1_c",
          type: "dialogue",
          text: "Gritar con toda tu rabia «¡¿Quién carajo me hizo esto?!».",
          requirement: { type: "none" },
          nextSceneId: "ch1_4",
          effects: [
            { type: "hungerDelta", delta: 1 },
            { type: "setFlag", flag: "bru_1_1_grito" },
          ],
        },
        {
          id: "ch1_1_d",
          type: "discipline",
          discipline: "potence",
          disciplineTitle: "Golpe de Ira",
          text: "Usar Potencia para destrozar todo lo que tengas a mano",
          textByDisciplineLevel: {
            2: "Potencia II: conviertes hierro y madera en astillas a puño limpio.",
            4: "Potencia IV: revientas la estructura completa en una explosión de polvo y metal.",
          },
          requirement: { type: "discipline", discipline: "potence", minLevel: 1 },
          nextSceneId: "ch1_5",
          effects: [
            { type: "hungerDelta", delta: 2 },
            { type: "setFlag", flag: "bru_1_1_potence" },
          ],
        },
      ],
    },
    {
      id: "ch1_2",
      chapterId: "chapter01",
      title: "1.2 · La furia ciega",
      text: `Golpeas la pared una y otra vez. El concreto se agrieta. Tus nudillos se abren. La sangre corre por tus brazos, pero no sientes dolor, solo una satisfacción salvaje.

La Bestia ríe dentro de ti. Por un momento te sientes vivo de nuevo... aunque sea de esta forma tan jodida.`,
      options: [
        {
          id: "ch1_2_a",
          type: "dialogue",
          text: "Seguir golpeando hasta agotarte",
          requirement: { type: "none" },
          nextSceneId: "ch1_6",
          effects: [
            { type: "hungerDelta", delta: 3 },
            { type: "humanityDelta", delta: -2 },
            { type: "setFlag", flag: "bru_1_2_blind_rage" },
          ],
        },
        {
          id: "ch1_2_b",
          type: "dialogue",
          text: "Intentar controlarte y buscar una salida",
          requirement: { type: "none" },
          nextSceneId: "ch1_3",
          effects: [{ type: "hungerDelta", delta: -1 }, { type: "setFlag", flag: "bru_1_2_recover" }],
        },
      ],
    },
    {
      id: "ch1_3",
      chapterId: "chapter01",
      title: "1.3 · Registro del sótano",
      text: "Entre cajas viejas y basura encuentras una tubería de metal, un celular sin batería y una botella rota. También ves huellas recientes en el polvo. Alguien estuvo aquí hace poco.",
      options: [
        {
          id: "ch1_3_a",
          type: "dialogue",
          text: "Tomar la tubería como arma",
          requirement: { type: "none" },
          nextSceneId: "ch1_6",
          effects: [{ type: "setFlag", flag: "bru_1_3_pipe" }],
        },
        {
          id: "ch1_3_b",
          type: "dialogue",
          text: "Intentar calmarte y pensar con claridad",
          requirement: { type: "none" },
          nextSceneId: "ch1_4",
          effects: [{ type: "hungerDelta", delta: -1 }, { type: "setFlag", flag: "bru_1_3_calm" }],
        },
        {
          id: "ch1_3_c",
          type: "dialogue",
          text: "Destrozar todo en un ataque de rabia",
          requirement: { type: "none" },
          nextSceneId: "ch1_2",
          effects: [{ type: "hungerDelta", delta: 2 }, { type: "setFlag", flag: "bru_1_3_breakdown" }],
        },
      ],
    },
    {
      id: "ch1_4",
      chapterId: "chapter01",
      title: "1.4 · El grito",
      text: "Tu grito de pura rabia hace vibrar las paredes. Segundos después escuchas pasos rápidos arriba. La puerta del sótano se abre de golpe y tres hombres armados bajan las escaleras apuntándote.",
      options: [
        {
          id: "ch1_4_a",
          type: "dialogue",
          text: "Lanzarte a pelear como un animal salvaje",
          requirement: { type: "none" },
          nextSceneId: "ch1_7",
          effects: [
            { type: "hungerDelta", delta: 3 },
            { type: "humanityDelta", delta: -2 },
            { type: "setFlag", flag: "bru_1_4_maul" },
          ],
        },
        {
          id: "ch1_4_b",
          type: "dialogue",
          text: "Gritarles insultos y provocarlos",
          requirement: { type: "none" },
          nextSceneId: "ch1_8",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "bru_1_4_taunt" }],
        },
        {
          id: "ch1_4_c",
          type: "dialogue",
          text: "Intentar hablar primero (aunque te cueste)",
          requirement: { type: "none" },
          nextSceneId: "ch1_9",
          effects: [{ type: "hungerDelta", delta: -1 }, { type: "setFlag", flag: "bru_1_4_talk" }],
        },
      ],
    },
    {
      id: "ch1_5",
      chapterId: "chapter01",
      title: "1.5 · Potencia desatada",
      text: "La rabia te consume. Con un rugido arrancas una viga metálica del techo y la usas para destrozar todo a tu paso. La puerta del sótano vuela por los aires.",
      options: [
        {
          id: "ch1_5_a",
          type: "dialogue",
          text: "Subir las escaleras buscando pelea",
          requirement: { type: "none" },
          nextSceneId: "ch1_7",
          effects: [{ type: "hungerDelta", delta: 2 }, { type: "setFlag", flag: "bru_1_5_hunt" }],
        },
        {
          id: "ch1_5_b",
          type: "dialogue",
          text: "Intentar controlar tu fuerza y avanzar con cuidado",
          requirement: { type: "none" },
          nextSceneId: "ch1_6",
          effects: [{ type: "hungerDelta", delta: -1 }, { type: "setFlag", flag: "bru_1_5_control" }],
        },
      ],
    },
    {
      id: "ch1_6",
      chapterId: "chapter01",
      title: "1.6 · La puerta cerrada",
      text: "Te encuentras frente a una puerta metálica reforzada con cadena y candado grueso. Escuchas voces y movimiento arriba. Alguien sabe que estás despierto.",
      options: [
        {
          id: "ch1_6_a",
          type: "dialogue",
          text: "Patear y gritar para provocarlos",
          requirement: { type: "none" },
          nextSceneId: "ch1_8",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "bru_1_6_provoke" }],
        },
        {
          id: "ch1_6_b",
          type: "discipline",
          discipline: "potence",
          disciplineTitle: "Cadena Muerta",
          text: "Intentar forzar la cadena con Potencia",
          requirement: { type: "discipline", discipline: "potence", minLevel: 2 },
          nextSceneId: "ch1_10",
          effects: [{ type: "setFlag", flag: "bru_1_6_chain_break" }],
        },
        {
          id: "ch1_6_c",
          type: "dialogue",
          text: "Esperar en silencio e intentar sorprenderlos",
          requirement: { type: "none" },
          nextSceneId: "ch1_11",
          effects: [{ type: "setFlag", flag: "bru_1_6_ambush" }],
        },
      ],
    },
    {
      id: "ch1_7",
      chapterId: "chapter01",
      title: "1.7 · La emboscada",
      text: "Subes las escaleras como un toro enfurecido y te encuentras en una sala mal iluminada. Tres hombres armados te apuntan. Uno de ellos, el más viejo, tiene una cicatriz en la cara y te mira con odio mezclado con miedo.",
      options: [
        {
          id: "ch1_7_a",
          type: "dialogue",
          text: "Lanzarte a pelear sin importar las consecuencias",
          requirement: { type: "none" },
          nextSceneId: "ch1_8",
          effects: [
            { type: "hungerDelta", delta: 3 },
            { type: "humanityDelta", delta: -2 },
            { type: "setFlag", flag: "bru_1_7_charge" },
          ],
        },
        {
          id: "ch1_7_b",
          type: "dialogue",
          text: "Gritarles y provocarlos para que ataquen primero",
          requirement: { type: "none" },
          nextSceneId: "ch1_9",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "bru_1_7_ko" }],
        },
        {
          id: "ch1_7_c",
          type: "discipline",
          discipline: "presence",
          disciplineTitle: "Pulso de Guerra",
          text: "Intentar intimidarlos con pura presencia y rabia",
          requirement: { type: "discipline", discipline: "presence", minLevel: 1 },
          nextSceneId: "ch1_10",
          effects: [{ type: "setFlag", flag: "bru_1_7_presence" }],
        },
      ],
    },
    {
      id: "ch1_8",
      chapterId: "chapter01",
      title: "1.8 · Combate salvaje",
      text: "Te lanzas contra ellos como un animal. El sonido de huesos rompiéndose y gritos llenan la habitación. La Bestia está eufórica. Sientes cómo la sangre caliente salpica tu rostro.",
      options: [
        {
          id: "ch1_8_a",
          type: "dialogue",
          text: "Dejarte llevar completamente por la rabia y beber",
          requirement: { type: "none" },
          nextSceneId: "ch1_12",
          effects: [
            { type: "hungerDelta", delta: 4 },
            { type: "humanityDelta", delta: -3 },
            { type: "setFlag", flag: "bru_1_8_bloodlust" },
          ],
        },
        {
          id: "ch1_8_b",
          type: "dialogue",
          text: "Controlarte lo suficiente para no matar a todos",
          requirement: { type: "none" },
          nextSceneId: "ch1_11",
          effects: [
            { type: "hungerDelta", delta: 2 },
            { type: "humanityDelta", delta: -1 },
            { type: "setFlag", flag: "bru_1_8_partial_control" },
          ],
        },
      ],
    },
    {
      id: "ch1_9",
      chapterId: "chapter01",
      title: "1.9 · Provocación",
      text: "Tus insultos y provocaciones hacen que los hombres pierdan los nervios. Uno de ellos dispara. La bala te atraviesa el hombro, pero apenas sientes dolor. Solo más rabia.",
      options: [
        {
          id: "ch1_9_a",
          type: "dialogue",
          text: "Atacar con mayor furia",
          requirement: { type: "none" },
          nextSceneId: "ch1_8",
          effects: [{ type: "hungerDelta", delta: 3 }, { type: "setFlag", flag: "bru_1_9_fury" }],
        },
        {
          id: "ch1_9_b",
          type: "discipline",
          discipline: "potence",
          disciplineTitle: "Aplastar y Desarmar",
          text: "Usar tu velocidad y fuerza para desarmarlos",
          requirement: { type: "discipline", discipline: "potence", minLevel: 2 },
          nextSceneId: "ch1_11",
          effects: [{ type: "setFlag", flag: "bru_1_9_disarm" }],
        },
      ],
    },
    {
      id: "ch1_10",
      chapterId: "chapter01",
      title: "1.10 · Intimidación Brujah",
      text: "Tu presencia salvaje y tu rabia los hace dudar. El hombre de la cicatriz baja lentamente el arma.",
      options: [
        {
          id: "ch1_10_a",
          type: "dialogue",
          text: "Exigirles respuestas sobre quién te convirtió",
          requirement: { type: "none" },
          nextSceneId: "ch1_13",
          effects: [{ type: "setFlag", flag: "bru_1_10_answers" }],
        },
        {
          id: "ch1_10_b",
          type: "dialogue",
          text: "Golpear a uno de ellos para demostrar quién manda",
          requirement: { type: "none" },
          nextSceneId: "ch1_11",
          effects: [{ type: "hungerDelta", delta: 2 }, { type: "setFlag", flag: "bru_1_10_show_force" }],
        },
      ],
    },
    {
      id: "ch1_11",
      chapterId: "chapter01",
      title: "1.11 · Control parcial",
      text: "Logras controlar tu rabia lo suficiente para no matarlos a todos. Uno de los hombres, aterrorizado, te dice entre balbuceos: “Fue la Camarilla… dijeron que eras especial… un Brujah fuerte…”",
      options: [
        {
          id: "ch1_11_a",
          type: "dialogue",
          text: "Dejarlos vivos y huir a la calle",
          requirement: { type: "none" },
          nextSceneId: "ch1_14",
          effects: [
            { type: "hungerDelta", delta: -1 },
            { type: "humanityDelta", delta: 1 },
            { type: "setFlag", flag: "bru_1_11_spare" },
          ],
        },
        {
          id: "ch1_11_b",
          type: "dialogue",
          text: "Beber de uno de ellos antes de irte",
          requirement: { type: "none" },
          nextSceneId: "ch1_12",
          effects: [{ type: "hungerDelta", delta: 2 }, { type: "setFlag", flag: "bru_1_11_feed" }],
        },
      ],
    },
    {
      id: "ch1_12",
      chapterId: "chapter01",
      title: "1.12 · El primer banquete",
      text: `La sangre caliente te llena la boca. La Bestia ruge de placer. Cuando terminas, miras los cuerpos en el suelo.

Por primera vez entiendes realmente lo que eres: un monstruo lleno de rabia.

Sales a la lluvia de Santiago con la boca manchada y una sonrisa salvaje.`,
      options: [
        {
          id: "ch1_12_end",
          type: "dialogue",
          text: "Continuar al Capítulo 2",
          requirement: { type: "none" },
          nextSceneId: "ch1_12",
          effects: [{ type: "setFlag", flag: "chapter01_dark_end" }, { type: "setFlag", flag: "chapter02_pending" }],
        },
      ],
    },
    {
      id: "ch1_13",
      chapterId: "chapter01",
      title: "1.13 · La revelación",
      text: "El hombre te revela entre temblores que fuiste abrazado por orden de alguien importante dentro de la Camarilla. “Dicen que los Brujah como tú son necesarios para la guerra que se viene…”",
      options: [
        {
          id: "ch1_13_a",
          type: "dialogue",
          text: "Dejarlos vivos y salir a la noche",
          requirement: { type: "none" },
          nextSceneId: "ch1_14",
          effects: [{ type: "setFlag", flag: "bru_1_13_revelation" }],
        },
      ],
    },
    {
      id: "ch1_14",
      chapterId: "chapter01",
      title: "1.14 · El primer control",
      text: `Sales a la calle bajo la fuerte lluvia de Santiago. La sangre se lava de tus manos, pero no de tu alma.

Sabes que nada volverá a ser igual. La Bestia sigue gruñendo dentro de ti, pero por ahora… la controlas.`,
      options: [
        {
          id: "ch1_14_end",
          type: "dialogue",
          text: "Continuar al Capítulo 2",
          requirement: { type: "none" },
          nextSceneId: "ch1_14",
          effects: [{ type: "setFlag", flag: "chapter01_balanced_end" }, { type: "setFlag", flag: "chapter02_pending" }],
        },
      ],
    },
    {
      id: "ch1v_1",
      chapterId: "chapter01",
      title: "1.1 · El despertar (Ventrue)",
      text: `Abres los ojos y lo primero que sientes es una profunda indignación.

Estás tirado en el suelo sucio de un sótano en Ñuñoa. Tu traje italiano, que costó más que el sueldo mensual de la mayoría de las personas, está arruinado con sangre y mugre. El hedor a humedad y concreto te ofende profundamente.

Esto es inaceptable.

Tu corazón ya no late.

Lo último que recuerdas es el rostro de una mujer de ojos fríos que te susurró: “Has sido Elegido. Ahora demuéstranos que eres digno de la sangre que corre por tus venas.”

Te levantas con dificultad, ajustando lo que queda de tu ropa. La Bestia susurra en tu mente, pero tú la callas con pura fuerza de voluntad. Un Ventrue no se revuelca como un animal. Un Ventrue controla.`,
      clanFlavor: {
        ventrue: "Tu linaje no te permite derrumbarte; incluso en ruinas, mandas.",
      },
      options: [
        {
          id: "ch1v_1_a",
          type: "dialogue",
          text: "Evaluar la situación con frialdad y buscar información",
          requirement: { type: "none" },
          nextSceneId: "ch1v_2",
          effects: [{ type: "hungerDelta", delta: -1 }, { type: "setFlag", flag: "ven_1_1_analyze" }],
        },
        {
          id: "ch1v_1_b",
          type: "dialogue",
          text: "Buscar tus pertenencias (reloj, billetera, teléfono)",
          requirement: { type: "none" },
          nextSceneId: "ch1v_3",
          effects: [{ type: "setFlag", flag: "ven_1_1_status" }],
        },
        {
          id: "ch1v_1_c",
          type: "dialogue",
          text: "Exigir en voz alta una explicación, como si aún estuvieras al mando.",
          requirement: { type: "none" },
          nextSceneId: "ch1v_3",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "ven_1_1_demand" }],
        },
        {
          id: "ch1v_1_d",
          type: "discipline",
          discipline: "dominate",
          disciplineTitle: "Mandato Interno",
          text: "Usar Dominación sobre ti mismo para calmarte y pensar con claridad",
          requirement: { type: "discipline", discipline: "dominate", minLevel: 1 },
          nextSceneId: "ch1v_5",
          effects: [{ type: "hungerDelta", delta: -2 }, { type: "setFlag", flag: "ven_1_1_self_dominate" }],
        },
      ],
    },
    {
      id: "ch1v_2",
      chapterId: "chapter01",
      title: "1.2 · Análisis frío",
      text: "A pesar de la humillación, tu mente funciona con precisión quirúrgica. Analizas el sótano: huellas recientes, una puerta reforzada con cadena y un viejo espejo roto.",
      options: [
        {
          id: "ch1v_2_a",
          type: "dialogue",
          text: "Arreglarte lo mejor posible antes de continuar",
          requirement: { type: "none" },
          nextSceneId: "ch1v_6",
          effects: [{ type: "setFlag", flag: "ven_1_2_authority" }],
        },
        {
          id: "ch1v_2_b",
          type: "dialogue",
          text: "Buscar una salida digna y estratégica",
          requirement: { type: "none" },
          nextSceneId: "ch1v_6",
          effects: [{ type: "setFlag", flag: "ven_1_2_elegant_exit" }],
        },
      ],
    },
    {
      id: "ch1v_3",
      chapterId: "chapter01",
      title: "1.3 · Tus pertenencias",
      text: "Encuentras tu billetera (sin dinero, pero con tus tarjetas y documentos) y tu reloj de lujo roto. Ver tus pertenencias en este estado te llena de una ira fría y controlada.",
      options: [
        {
          id: "ch1v_3_a",
          type: "dialogue",
          text: "Intentar abrir la puerta con autoridad",
          requirement: { type: "none" },
          nextSceneId: "ch1v_6",
          effects: [{ type: "setFlag", flag: "ven_1_3_authority_door" }],
        },
        {
          id: "ch1v_3_b",
          type: "discipline",
          discipline: "dominate",
          disciplineTitle: "Voz de Trono",
          text: "Usar Dominación para proyectar tu voluntad hacia arriba",
          requirement: { type: "discipline", discipline: "dominate", minLevel: 2 },
          nextSceneId: "ch1v_7",
          effects: [{ type: "setFlag", flag: "ven_1_3_dominate" }],
        },
      ],
    },
    {
      id: "ch1v_4",
      chapterId: "chapter01",
      title: "1.4 · La exigencia",
      text: `Gritas con voz firme y educada: “¡Exijo una explicación inmediata!”

La puerta se abre. Un hombre con traje barato baja las escaleras, visiblemente nervioso.`,
      options: [
        {
          id: "ch1v_4_a",
          type: "discipline",
          discipline: "dominate",
          disciplineTitle: "Mandato de Corte",
          text: "Usar Dominación para obligarlo a hablar",
          requirement: { type: "discipline", discipline: "dominate", minLevel: 2 },
          nextSceneId: "ch1v_8",
          effects: [{ type: "setFlag", flag: "ven_1_4_force" }],
        },
        {
          id: "ch1v_4_b",
          type: "dialogue",
          text: "Negociar con él como si fueras superior",
          requirement: { type: "none" },
          nextSceneId: "ch1v_9",
          effects: [{ type: "setFlag", flag: "ven_1_4_negotiate" }],
        },
      ],
    },
    {
      id: "ch1v_5",
      chapterId: "chapter01",
      title: "1.5 · Dominación interna",
      text: "Cierras los ojos y usas tu sangre para acallar a la Bestia. Sientes cómo tu mente se aclara. Eres Ventrue. No te comportas como un animal.",
      options: [
        {
          id: "ch1v_5_a",
          type: "dialogue",
          text: "Salir del sótano con dignidad y control",
          requirement: { type: "none" },
          nextSceneId: "ch1v_6",
          effects: [{ type: "setFlag", flag: "ven_1_5_controlled_exit" }],
        },
      ],
    },
    {
      id: "ch1v_6",
      chapterId: "chapter01",
      title: "1.6 · El encuentro superior",
      text: "Sales del sótano y entras en una casa abandonada pero con restos de lujo. Una mujer elegante y un hombre de seguridad te esperan. La mujer te observa con interés.",
      options: [
        {
          id: "ch1v_6_a",
          type: "dialogue",
          text: "Tomar el control de la conversación con autoridad natural",
          requirement: { type: "none" },
          nextSceneId: "ch1v_10",
          effects: [{ type: "setFlag", flag: "ven_1_6_command" }],
        },
        {
          id: "ch1v_6_b",
          type: "discipline",
          discipline: "dominate",
          disciplineTitle: "Orden Imperial",
          text: "Usar Dominación en la mujer para que te obedezca",
          requirement: { type: "discipline", discipline: "dominate", minLevel: 2 },
          nextSceneId: "ch1v_11",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "ven_1_6_force" }],
        },
        {
          id: "ch1v_6_c",
          type: "dialogue",
          text: "Exigir respuestas sobre quién te abrazó",
          requirement: { type: "none" },
          nextSceneId: "ch1v_10",
          effects: [{ type: "setFlag", flag: "ven_1_6_demand_answers" }],
        },
      ],
    },
    {
      id: "ch1v_7",
      chapterId: "chapter01",
      title: "1.7 · Dominación sobre el subalterno",
      text: "Tu voluntad se proyecta como un látigo invisible. El hombre que bajó las escaleras te mira con los ojos vidriosos y empieza a hablar sin poder resistirse.",
      options: [
        {
          id: "ch1v_7_a",
          type: "discipline",
          discipline: "dominate",
          disciplineTitle: "Látigo de Voluntad",
          text: "Ordenarle que te cuente todo lo que sabe",
          requirement: { type: "discipline", discipline: "dominate", minLevel: 2 },
          nextSceneId: "ch1v_10",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "ven_1_7_interrogate" }],
        },
        {
          id: "ch1v_7_b",
          type: "discipline",
          discipline: "dominate",
          disciplineTitle: "Cadena de Mando",
          text: "Ordenarle que te lleve con quien esté al mando",
          requirement: { type: "discipline", discipline: "dominate", minLevel: 3 },
          nextSceneId: "ch1v_11",
          effects: [{ type: "hungerDelta", delta: 2 }, { type: "setFlag", flag: "ven_1_7_escalate" }],
        },
      ],
    },
    {
      id: "ch1v_8",
      chapterId: "chapter01",
      title: "1.8 · La negociación",
      text: "El hombre te revela entre temblores que fuiste abrazado por órdenes de alguien importante dentro de la Camarilla local. “Dicen que los Ventrue como tú son necesarios para restaurar el orden…”",
      options: [
        {
          id: "ch1v_8_a",
          type: "dialogue",
          text: "Negociar información a cambio de tu cooperación futura",
          requirement: { type: "none" },
          nextSceneId: "ch1v_10",
          effects: [{ type: "setFlag", flag: "ven_1_8_negotiate" }],
        },
        {
          id: "ch1v_8_b",
          type: "dialogue",
          text: "Exigir que te lleven ante su superior inmediatamente",
          requirement: { type: "none" },
          nextSceneId: "ch1v_11",
          effects: [{ type: "setFlag", flag: "ven_1_8_escalate" }],
        },
      ],
    },
    {
      id: "ch1v_9",
      chapterId: "chapter01",
      title: "1.9 · La confrontación con la mujer",
      text: "La mujer elegante te observa con una mezcla de respeto y cálculo. Parece que ella está al mando de esta operación.",
      options: [
        {
          id: "ch1v_9_a",
          type: "dialogue",
          text: "Tomar el control de la conversación con superioridad aristocrática",
          requirement: { type: "none" },
          nextSceneId: "ch1v_12",
          effects: [{ type: "setFlag", flag: "ven_1_9_aristocracy" }],
        },
        {
          id: "ch1v_9_b",
          type: "discipline",
          discipline: "dominate",
          disciplineTitle: "Veredicto de Sangre",
          text: "Usar Dominación para obligarla a revelarte la verdad completa",
          requirement: { type: "discipline", discipline: "dominate", minLevel: 2 },
          nextSceneId: "ch1v_13",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "ven_1_9_force_truth" }],
        },
      ],
    },
    {
      id: "ch1v_10",
      chapterId: "chapter01",
      title: "1.10 · La revelación controlada",
      text: "La mujer te confirma lo que temías y esperabas: fuiste abrazado por la Camarilla. Eres Ventrue. Te han elegido para formar parte de la élite que mantiene el orden en Santiago.",
      options: [
        {
          id: "ch1v_10_a",
          type: "dialogue",
          text: "Aceptar tu nueva posición con dignidad y estrategia",
          requirement: { type: "none" },
          nextSceneId: "ch1v_14",
          effects: [{ type: "setFlag", flag: "ven_1_10_accept" }],
        },
        {
          id: "ch1v_10_b",
          type: "dialogue",
          text: "Exigir más poder e información antes de comprometerte",
          requirement: { type: "none" },
          nextSceneId: "ch1v_14",
          effects: [{ type: "setFlag", flag: "ven_1_10_demand_power" }],
        },
      ],
    },
    {
      id: "ch1v_11",
      chapterId: "chapter01",
      title: "1.11 · La Dominación exitosa",
      text: "Tu Dominación es absoluta. La mujer te obedece y te revela secretos importantes sobre la situación actual de la ciudad y la Camarilla.",
      options: [
        {
          id: "ch1v_11_a",
          type: "dialogue",
          text: "Dejarla viva y salir con información valiosa",
          requirement: { type: "none" },
          nextSceneId: "ch1v_14",
          effects: [{ type: "setFlag", flag: "ven_1_11_spare" }],
        },
        {
          id: "ch1v_11_b",
          type: "dialogue",
          text: "Beber de ella antes de irte (controlado)",
          requirement: { type: "none" },
          nextSceneId: "ch1v_13",
          effects: [{ type: "hungerDelta", delta: 2 }, { type: "setFlag", flag: "ven_1_11_feed" }],
        },
      ],
    },
    {
      id: "ch1v_12",
      chapterId: "chapter01",
      title: "1.12 · La aceptación aristocrática",
      text: `Sales a la lluvia de Santiago con la cabeza en alto. Aunque tu traje está arruinado, tu porte sigue siendo el de un rey destronado que planea recuperar su corona.

Sabes que esta es solo la primera noche de muchas. Y tú estás hecho para reinar.`,
      options: [
        {
          id: "ch1v_12_end",
          type: "dialogue",
          text: "Continuar al Capítulo 2",
          requirement: { type: "none" },
          nextSceneId: "ch1v_12",
          effects: [{ type: "setFlag", flag: "chapter01_ventrue_balanced_end" }, { type: "setFlag", flag: "chapter02_pending" }],
        },
      ],
    },
    {
      id: "ch1v_13",
      chapterId: "chapter01",
      title: "1.13 · El banquete de los elegidos",
      text: "Bebes con elegancia y control. La sangre tiene un sabor exquisito. Limpias tu boca con un pañuelo que encontraste en el bolsillo del hombre.",
      options: [
        {
          id: "ch1v_13_end",
          type: "dialogue",
          text: "Continuar al Capítulo 2",
          requirement: { type: "none" },
          nextSceneId: "ch1v_13",
          effects: [
            { type: "hungerDelta", delta: 2 },
            { type: "setFlag", flag: "chapter01_ventrue_dark_end" },
            { type: "setFlag", flag: "chapter02_pending" },
          ],
        },
      ],
    },
    {
      id: "ch1v_14",
      chapterId: "chapter01",
      title: "1.14 · Salida a la noche",
      text: `Sales bajo la lluvia torrencial de Santiago. Las luces de la ciudad brillan como joyas sobre el asfalto mojado.

Eres Ventrue. Eres superior. Y esta ciudad aún no sabe con quién se ha metido.`,
      options: [
        {
          id: "ch1v_14_end",
          type: "dialogue",
          text: "Continuar al Capítulo 2",
          requirement: { type: "none" },
          nextSceneId: "ch1v_14",
          effects: [{ type: "setFlag", flag: "chapter01_ventrue_neutral_end" }, { type: "setFlag", flag: "chapter02_pending" }],
        },
      ],
    },
    {
      id: "ch1t_1",
      chapterId: "chapter01",
      title: "1.1 · El despertar (Toreador)",
      text: `Abres los ojos y lo primero que sientes es una oleada de repulsión estética.

Estás tirado en un sótano sucio, húmedo y maloliente de Ñuñoa. El contraste entre tu sensibilidad refinada y este lugar te resulta casi doloroso. Tu ropa —elegante incluso en la muerte— está manchada de sangre y tierra.

Esto es una ofensa a la belleza.

Lo último que recuerdas es el rostro de una mujer de ojos hipnóticos y una voz suave que te susurró: “Ahora podrás ver la verdadera belleza… y pagarás por ella con tu alma.”

Te incorporas con gracia natural, a pesar del asco. La Bestia no ruge de rabia, sino que suspira con un hambre profunda de sensaciones, colores, emociones y dolor hermoso.`,
      clanFlavor: {
        toreador: "Donde otros ven ruina, tu maldición te obliga a encontrar composición y drama.",
      },
      options: [
        {
          id: "ch1t_1_a",
          type: "dialogue",
          text: "Observar con detalle tu entorno, buscando algo bello entre la fealdad",
          requirement: { type: "none" },
          nextSceneId: "ch1t_2",
          effects: [{ type: "setFlag", flag: "tor_1_1_observe" }],
        },
        {
          id: "ch1t_1_b",
          type: "dialogue",
          text: "Tocar tu rostro y cuerpo, intentando reconocerte en esta nueva forma",
          requirement: { type: "none" },
          nextSceneId: "ch1t_3",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "tor_1_1_self_scan" }],
        },
        {
          id: "ch1t_1_c",
          type: "dialogue",
          text: "Llorar en silencio por la pérdida de tu vida mortal y su belleza",
          requirement: { type: "none" },
          nextSceneId: "ch1t_4",
          effects: [
            { type: "hungerDelta", delta: -1 },
            { type: "humanityDelta", delta: 1 },
            { type: "setFlag", flag: "tor_1_1_grief" },
          ],
        },
        {
          id: "ch1t_1_d",
          type: "discipline",
          discipline: "auspex",
          disciplineTitle: "Ojo de Ceniza",
          text: "Usar Auspex para percibir más allá de la oscuridad del sótano",
          requirement: { type: "discipline", discipline: "auspex", minLevel: 1 },
          nextSceneId: "ch1t_5",
          effects: [{ type: "setFlag", flag: "tor_1_1_auspex" }],
        },
      ],
    },
    {
      id: "ch1t_2",
      chapterId: "chapter01",
      title: "1.2 · La belleza oculta",
      text: "A pesar de la suciedad encuentras un viejo espejo roto. Tu reflejo te impacta: estás más hermoso y trágico que nunca. La Maldición te ha refinado de una forma cruel y exquisita.",
      options: [
        {
          id: "ch1t_2_a",
          type: "dialogue",
          text: "Arreglarte lo mejor posible, recuperando tu dignidad estética",
          requirement: { type: "none" },
          nextSceneId: "ch1t_6",
          effects: [{ type: "setFlag", flag: "tor_1_2_composure" }],
        },
        {
          id: "ch1t_2_b",
          type: "dialogue",
          text: "Romper el espejo en un acto dramático y poético",
          requirement: { type: "none" },
          nextSceneId: "ch1t_6",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "tor_1_2_shatter" }],
        },
      ],
    },
    {
      id: "ch1t_3",
      chapterId: "chapter01",
      title: "1.3 · La melancolía artística",
      text: "Las lágrimas corren por tus mejillas. La belleza de tu antigua vida mortal se ha perdido para siempre. El dolor es tan intenso que casi resulta placentero.",
      options: [
        {
          id: "ch1t_3_a",
          type: "dialogue",
          text: "Dejarte llevar por la melancolía unos momentos más",
          requirement: { type: "none" },
          nextSceneId: "ch1t_6",
          effects: [{ type: "hungerDelta", delta: -1 }, { type: "setFlag", flag: "tor_1_3_melancholy" }],
        },
        {
          id: "ch1t_3_b",
          type: "dialogue",
          text: "Canalizar esa tristeza en algo creativo (escribir en la pared, cantar, etc.)",
          requirement: { type: "none" },
          nextSceneId: "ch1t_6",
          effects: [{ type: "setFlag", flag: "tor_1_3_create" }],
        },
      ],
    },
    {
      id: "ch1t_4",
      chapterId: "chapter01",
      title: "1.4 · Auspex despertado",
      text: "El mundo se agudiza de forma abrumadora. Escuchas el latido acelerado de corazones arriba, ves rastros de calor en las paredes y sientes la emoción cruda de quienes te esperan.",
      options: [
        {
          id: "ch1t_4_a",
          type: "dialogue",
          text: "Subir las escaleras con gracia y elegancia",
          requirement: { type: "none" },
          nextSceneId: "ch1t_6",
          effects: [{ type: "setFlag", flag: "tor_1_4_ascend" }],
        },
      ],
    },
    {
      id: "ch1t_5",
      chapterId: "chapter01",
      title: "1.5 · Visión Auspex",
      text: "Tu Auspex te revela auras: ambición y miedo en la mujer, terror puro en el hombre. Sabes que no están aquí para matarte… todavía.",
      options: [
        {
          id: "ch1t_5_a",
          type: "dialogue",
          text: "Subir con confianza artística",
          requirement: { type: "none" },
          nextSceneId: "ch1t_6",
          effects: [{ type: "setFlag", flag: "tor_1_5_auras" }],
        },
      ],
    },
    {
      id: "ch1t_6",
      chapterId: "chapter01",
      title: "1.6 · El encuentro con la belleza y el horror",
      text: "Sales del sótano y entras en una casa abandonada pero con restos de antiguo lujo. Una mujer elegante y un hombre tatuado te esperan. La mujer te mira con fascinación y algo de envidia.",
      options: [
        {
          id: "ch1t_6_a",
          type: "discipline",
          discipline: "presence",
          disciplineTitle: "Aura Escénica",
          text: "Encantarlos con tu Presencia y belleza sobrenatural",
          requirement: { type: "discipline", discipline: "presence", minLevel: 1 },
          nextSceneId: "ch1t_9",
          effects: [{ type: "setFlag", flag: "tor_1_6_charm" }],
        },
        {
          id: "ch1t_6_b",
          type: "dialogue",
          text: "Preguntar dramáticamente qué te han hecho a tu vida",
          requirement: { type: "none" },
          nextSceneId: "ch1t_7",
          effects: [{ type: "setFlag", flag: "tor_1_6_drama" }],
        },
        {
          id: "ch1t_6_c",
          type: "discipline",
          discipline: "auspex",
          disciplineTitle: "Lectura de Auras",
          text: "Usar Auspex para leer profundamente sus intenciones",
          requirement: { type: "discipline", discipline: "auspex", minLevel: 1 },
          nextSceneId: "ch1t_8",
          effects: [{ type: "setFlag", flag: "tor_1_6_auspex_read" }],
        },
      ],
    },
    {
      id: "ch1t_7",
      chapterId: "chapter01",
      title: "1.7 · La confrontación dramática",
      text: "Con voz temblorosa pero llena de dramatismo exiges respuestas. La mujer te observa con una mezcla de fascinación y lástima, como quien admira una obra de arte trágica.",
      options: [
        {
          id: "ch1t_7_a",
          type: "dialogue",
          text: "Negociar información con encanto y sutileza",
          requirement: { type: "none" },
          nextSceneId: "ch1t_9",
          effects: [{ type: "setFlag", flag: "tor_1_7_negotiate" }],
        },
        {
          id: "ch1t_7_b",
          type: "discipline",
          discipline: "dominate",
          disciplineTitle: "Dominación de Terciopelo",
          text: "Usar Dominación sutil para obligarla a hablar",
          requirement: { type: "discipline", discipline: "dominate", minLevel: 1 },
          nextSceneId: "ch1t_10",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "tor_1_7_dominate" }],
        },
        {
          id: "ch1t_7_c",
          type: "dialogue",
          text: "Dejarte llevar por la emoción y exigir respuestas con pasión",
          requirement: { type: "none" },
          nextSceneId: "ch1t_11",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "tor_1_7_passion" }],
        },
      ],
    },
    {
      id: "ch1t_8",
      chapterId: "chapter01",
      title: "1.8 · Lectura profunda con Auspex",
      text: "El mundo se vuelve cristalino. Ves el aura de la mujer: ambición teñida de miedo y deseo. El hombre irradia pánico. Sabes exactamente cómo se sienten.",
      options: [
        {
          id: "ch1t_8_a",
          type: "dialogue",
          text: "Hablarles con vulnerabilidad artística y honestidad",
          requirement: { type: "none" },
          nextSceneId: "ch1t_9",
          effects: [{ type: "hungerDelta", delta: -1 }, { type: "setFlag", flag: "tor_1_8_honesty" }],
        },
        {
          id: "ch1t_8_b",
          type: "dialogue",
          text: "Manipular sus emociones usando lo que percibes",
          requirement: { type: "none" },
          nextSceneId: "ch1t_10",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "tor_1_8_manipulate" }],
        },
      ],
    },
    {
      id: "ch1t_9",
      chapterId: "chapter01",
      title: "1.9 · La revelación",
      text: `La mujer te mira con respeto y cierta melancolía.

“Eres Toreador. Los más sensibles, los más bellos y los más condenados a sufrir por esa belleza. Fuiste abrazado por orden de alguien importante. La Camarilla está fracturada y la Segunda Inquisición acecha en las sombras. Bienvenido a la eternidad, artista.”`,
      options: [
        {
          id: "ch1t_9_a",
          type: "dialogue",
          text: "Aceptar tu nueva naturaleza con trágica elegancia",
          requirement: { type: "none" },
          nextSceneId: "ch1t_12",
          effects: [{ type: "setFlag", flag: "tor_1_9_accept" }],
        },
        {
          id: "ch1t_9_b",
          type: "dialogue",
          text: "Rechazar todo esto con dolor artístico",
          requirement: { type: "none" },
          nextSceneId: "ch1t_13",
          effects: [
            { type: "hungerDelta", delta: 2 },
            { type: "humanityDelta", delta: -1 },
            { type: "setFlag", flag: "tor_1_9_reject" },
          ],
        },
        {
          id: "ch1t_9_c",
          type: "dialogue",
          text: "Preguntar por tu sire con fascinación y tristeza",
          requirement: { type: "none" },
          nextSceneId: "ch1t_14",
          effects: [{ type: "setFlag", flag: "tor_1_9_sire" }],
        },
      ],
    },
    {
      id: "ch1t_10",
      chapterId: "chapter01",
      title: "1.10 · La seducción oscura",
      text: "Tu Presencia es demasiado poderosa. La mujer se acerca voluntariamente, casi hipnotizada, y te ofrece su cuello. Bebes con avidez, saboreando cada latido, cada sensación. Es hermoso y horrible al mismo tiempo.",
      options: [
        {
          id: "ch1t_10_a",
          type: "dialogue",
          text: "Continuar bebiendo hasta saciarte",
          requirement: { type: "none" },
          nextSceneId: "ch1t_13",
          effects: [
            { type: "hungerDelta", delta: 3 },
            { type: "humanityDelta", delta: -2 },
            { type: "setFlag", flag: "tor_1_10_overfeed" },
          ],
        },
        {
          id: "ch1t_10_b",
          type: "dialogue",
          text: "Detenerte a tiempo, con autocontrol artístico",
          requirement: { type: "none" },
          nextSceneId: "ch1t_12",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "tor_1_10_control" }],
        },
      ],
    },
    {
      id: "ch1t_11",
      chapterId: "chapter01",
      title: "1.11 · El eco de la escena",
      text: `La tensión no se rompe: se vuelve teatro. La mujer sostiene tu mirada, el guardia evita la tuya, y en el aire queda un silencio denso, casi íntimo.

No obtienes toda la verdad, pero sí lo suficiente para entender que esta noche fue una audición. Y tú acabas de pasarla.`,
      options: [
        {
          id: "ch1t_11_a",
          type: "dialogue",
          text: "Aceptar el juego político y retirarte con elegancia",
          requirement: { type: "none" },
          nextSceneId: "ch1t_14",
          effects: [{ type: "setFlag", flag: "tor_1_11_exit_elegant" }],
        },
        {
          id: "ch1t_11_b",
          type: "dialogue",
          text: "Dejar una advertencia poética antes de marcharte",
          requirement: { type: "none" },
          nextSceneId: "ch1t_14",
          effects: [{ type: "hungerDelta", delta: 1 }, { type: "setFlag", flag: "tor_1_11_warning" }],
        },
      ],
    },
    {
      id: "ch1t_12",
      chapterId: "chapter01",
      title: "1.12 · La belleza trágica",
      text: `Sales a la lluvia torrencial de Santiago. Las luces de neón se reflejan en los charcos como diamantes rotos. Todo es más intenso, más hermoso y más doloroso que nunca.

Entiendes que has sido condenado a una eternidad de arte, pasión y sufrimiento exquisito.

Fin del Capítulo 1.`,
      options: [
        {
          id: "ch1t_12_end",
          type: "dialogue",
          text: "Continuar al Capítulo 2",
          requirement: { type: "none" },
          nextSceneId: "ch1t_12",
          effects: [{ type: "setFlag", flag: "chapter01_toreador_balanced_end" }, { type: "setFlag", flag: "chapter02_pending" }],
        },
      ],
    },
    {
      id: "ch1t_13",
      chapterId: "chapter01",
      title: "1.13 · La tragedia hermosa",
      text: `La sangre en tu boca sabe a pecado y poesía. Miras los cuerpos en el suelo y sientes una mezcla de éxtasis y profunda tristeza.

La belleza duele. Y tú ahora eres parte de esa belleza eterna y terrible.`,
      options: [
        {
          id: "ch1t_13_end",
          type: "dialogue",
          text: "Continuar al Capítulo 2",
          requirement: { type: "none" },
          nextSceneId: "ch1t_13",
          effects: [
            { type: "hungerDelta", delta: 3 },
            { type: "setFlag", flag: "chapter01_toreador_dark_end" },
            { type: "setFlag", flag: "chapter02_pending" },
          ],
        },
      ],
    },
    {
      id: "ch1t_14",
      chapterId: "chapter01",
      title: "1.14 · Salida a la noche",
      text: `Sales bajo la lluvia de Santiago y las luces de neón se derriten sobre el asfalto mojado como una pintura viva.

Tu antigua vida queda atrás, pero no desaparece: se transforma en materia prima. Belleza, deseo, pérdida, hambre.

Eres Toreador. Y esta ciudad, con toda su miseria y su fulgor, acaba de convertirse en tu escenario.`,
      options: [
        {
          id: "ch1t_14_end",
          type: "dialogue",
          text: "Continuar al Capítulo 2",
          requirement: { type: "none" },
          nextSceneId: "ch1t_14",
          effects: [{ type: "setFlag", flag: "chapter01_toreador_neutral_end" }, { type: "setFlag", flag: "chapter02_pending" }],
        },
      ],
    },
  ],
};
