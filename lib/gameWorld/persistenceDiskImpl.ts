/**
 * Implementación disco (Node `fs`). Cargada vía import dinámico para no enlazar NFT/Turbopack
 * hasta que `NEXO_ORCH_DISK` esté activo.
 */

import fs from "fs";
import path from "path";

import type { NexoOrchestrationState } from "./types";
import { normalizeOrchestrationState } from "./stateMerge";

const FILE =
  process.env.NEXO_ORCH_PATH?.trim() ||
  path.join(/* turbopackIgnore: true */ process.cwd(), ".data", "nexo-orchestration.json");

function ensureDir(): boolean {
  try {
    const dir = path.dirname(FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

export function loadDiskSnapshotSync(): NexoOrchestrationState | null {
  try {
    if (!fs.existsSync(FILE)) return null;
    const raw = fs.readFileSync(FILE, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    return normalizeOrchestrationState(parsed);
  } catch {
    return null;
  }
}

export function saveDiskSnapshotSync(world: NexoOrchestrationState): void {
  if (!ensureDir()) return;
  try {
    const tmp = `${FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(world, null, 2), "utf-8");
    fs.renameSync(tmp, FILE);
  } catch {
    /* permisos / serverless */
  }
}
