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
  decisionHistory: {
    sceneId: string;
    optionId: string;
    ts: number;
    rollSummary?: string;
    rollPassed?: boolean;
  }[];
  updatedAt: number;
};
