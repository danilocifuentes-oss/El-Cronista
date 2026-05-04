import type { SoloChapter, SoloScene } from "@/lib/soloCampaign/types";
import { chapter01 } from "./chapter01";

export const SOLO_CHAPTERS: SoloChapter[] = [chapter01];

export function getSoloChapter(chapterId: string): SoloChapter | null {
  return SOLO_CHAPTERS.find((c) => c.id === chapterId) ?? null;
}

export function getSoloScene(chapterId: string, sceneId: string): SoloScene | null {
  const chapter = getSoloChapter(chapterId);
  if (!chapter) return null;
  return chapter.scenes.find((s) => s.id === sceneId) ?? null;
}
