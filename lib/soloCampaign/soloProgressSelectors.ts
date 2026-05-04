import type { SoloProgress } from "./types";

export const SOLO_CHAPTER_PENDING_PREFIX = "chapter_pending_";

export function getPendingNextChapter(progress: SoloProgress): string | null {
  for (const [flag, enabled] of Object.entries(progress.flags ?? {})) {
    if (!enabled) continue;
    if (!flag.startsWith(SOLO_CHAPTER_PENDING_PREFIX)) continue;
    const target = flag.slice(SOLO_CHAPTER_PENDING_PREFIX.length);
    if (!target || target === progress.chapterId) continue;
    return target;
  }
  return null;
}
