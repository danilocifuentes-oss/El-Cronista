/**
 * Motor narrativo interno (sin LLM externo).
 * Implementación: `lib/internal-engine` (Arquitecto del Nexo v1).
 */
export {
  generateInternalNarrador,
  generateInternalNexoNarration,
} from "@/lib/internal-engine/narrador";
export type { InternalNarradorEngineResult, NexoInternalV1Payload } from "@/lib/internal-engine/narrador";
