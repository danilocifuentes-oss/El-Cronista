import type { CharacterSheet, ClanId } from "@/lib/character";
import type { DisciplineKey } from "@/lib/sereno";

export type SoloRequirement =
  | { type: "none" }
  | { type: "clan"; clan: ClanId }
  | { type: "discipline"; discipline: DisciplineKey; minLevel: number }
  | { type: "skill"; skill: string; minLevel: number }
  | { type: "attribute"; attribute: keyof CharacterSheet["attributes"]; minLevel: number };

export type SoloOptionType = "dialogue" | "discipline" | "skill" | "clan";

export type SoloSceneEffect =
  | { type: "setFlag"; flag: string; value?: boolean }
  | { type: "hungerDelta"; delta: number }
  | { type: "humanityDelta"; delta: number }
  | { type: "reputationDelta"; delta: number }
  /** Daño a integridad física (positivo = más herido; negativo = recupera cajones). Tope alineado con HUD Nexo (7). */
  | { type: "healthDamageDelta"; delta: number }
  /** Fuerza de voluntad actual (no supera máximo de ficha). */
  | { type: "willpowerDelta"; delta: number }
  /** Experiencia de crónica (PX narrativos, acumulados en `SoloProgress.chronicleExperience`). */
  | { type: "experienceDelta"; delta: number }
  | { type: "log"; text: string };

export type SoloOption = {
  id: string;
  type: SoloOptionType;
  text: string;
  disciplineTitle?: string;
  textByDisciplineLevel?: Record<number, string>;
  requirement: SoloRequirement;
  nextSceneId: string;
  /** Rama opcional cuando la tirada falla (si no existe, usa nextSceneId). */
  nextSceneIdOnFail?: string;
  /** Rama opcional en crítico limpio/manchado (si no existe, usa nextSceneId). */
  nextSceneIdOnCritical?: string;
  discipline?: DisciplineKey;
  skill?: string;
  clan?: ClanId;
  effects?: SoloSceneEffect[];
  effectsOnFail?: SoloSceneEffect[];
  effectsOnCritical?: SoloSceneEffect[];
  /**
   * PX de crónica si la tirada asociada a esta opción tiene éxito.
   * Omitir para usar `CHRONICLE_XP_ROLL_SUCCESS_DEFAULT` en mecánica global.
   */
  experienceOnSuccessfulRoll?: number;
};

export type SoloScene = {
  id: string;
  chapterId: string;
  title: string;
  text: string;
  clanFlavor?: Partial<Record<ClanId, string>>;
  options: SoloOption[];
};

export type SoloChapter = {
  id: string;
  title: string;
  description: string;
  startSceneId: string;
  scenes: SoloScene[];
};

export type SoloProgress = {
  version: 1;
  profileId: string;
  playerName: string;
  clan: ClanId;
  humanity: number;
  reputation: number;
  /** Experiencia ganada en campaña solitaria (tiradas, hitos); independiente del pool de compra del Codex. */
  chronicleExperience: number;
  chapterId: string;
  sceneId: string;
  /**
   * Última versión del preludio cronista que el jugador descartó con "Comenzar con esta voz".
   * Inferior a `CHRONICLE_PRELUDE_CONTENT_VERSION` ⇒ mostrar cortina de nuevo.
   */
  chroniclePreludeSeenVersion?: number;
  /**
   * Por capítulo que define contexto (`SOLO_CHAPTER_CONTEXT_REGISTRY`): última versión de texto ya vista.
   */
  chapterContextSeen?: Record<string, number>;
  flags: Record<string, boolean>;
  visitedSceneIds: string[];
  /**
   * Pila temporal (QA): posición antes de cada avance manual de escena, para poder retroceder.
   */
  soloSceneBackStack?: { chapterId: string; sceneId: string }[];
  decisionHistory: {
    sceneId: string;
    optionId: string;
    ts: number;
    rollSummary?: string;
    rollPassed?: boolean;
  }[];
  updatedAt: number;
};
