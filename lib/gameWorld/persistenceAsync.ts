import type { NexoOrchestrationState } from "./types";

const DISK_FLAG = process.env.NEXO_ORCH_DISK === "1" || process.env.NEXO_ORCH_DISK === "true";

export async function loadOrchestrationDisk(): Promise<NexoOrchestrationState | null> {
  if (!DISK_FLAG) return null;
  try {
    const { loadDiskSnapshotSync } = await import("./persistenceDiskImpl");
    return loadDiskSnapshotSync();
  } catch (e) {
    console.warn("[orchestration] disk load skipped", e);
    return null;
  }
}

export async function saveOrchestrationDisk(world: NexoOrchestrationState): Promise<void> {
  if (!DISK_FLAG) return;
  try {
    const { saveDiskSnapshotSync } = await import("./persistenceDiskImpl");
    saveDiskSnapshotSync(world);
  } catch (e) {
    console.warn("[orchestration] disk save skipped", e);
  }
}
