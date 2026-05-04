import type { SoloChapter, SoloScene } from "@/lib/soloCampaign/types";
import { chapter01 } from "./chapter01";
import { chapter02 } from "./chapter02";
import { chapter03 } from "./chapter03";
import { chapter04 } from "./chapter04";
import { chapter05 } from "./chapter05";
import { chapter06 } from "./chapter06";
import { chapter07 } from "./chapter07";
import { chapter08 } from "./chapter08";
import { chapter09 } from "./chapter09";
import { chapter10 } from "./chapter10";
import { chapter11 } from "./chapter11";
import { chapter12 } from "./chapter12";
import { chapter13 } from "./chapter13";
import { soloEpilogue } from "./epilogue";

export const SOLO_CHAPTERS: SoloChapter[] = [
  chapter01,
  chapter02,
  chapter03,
  chapter04,
  chapter05,
  chapter06,
  chapter07,
  chapter08,
  chapter09,
  chapter10,
  chapter11,
  chapter12,
  chapter13,
  soloEpilogue,
];

export function getSoloChapter(chapterId: string): SoloChapter | null {
  return SOLO_CHAPTERS.find((c) => c.id === chapterId) ?? null;
}

export function getSoloScene(chapterId: string, sceneId: string): SoloScene | null {
  const chapter = getSoloChapter(chapterId);
  if (!chapter) return null;
  return chapter.scenes.find((s) => s.id === sceneId) ?? null;
}
