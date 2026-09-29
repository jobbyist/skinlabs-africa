/**
 * @deprecated Superseded by src/lib/pendingIntent.ts (onboarding overhaul 02),
 * which generalises the plan-only intent into { action, plan?, interval?,
 * variantKey?, returnTo, ts }. This shim only re-exports it; import from
 * "@/lib/pendingIntent" in new code.
 */
export * from "./pendingIntent";
export {
  getPendingIntent as getPendingPlanIntent,
  setPendingIntent as setPendingPlanIntent,
  clearPendingIntent as clearPendingPlanIntent,
  withPendingIntentParams as withPendingPlanParams,
} from "./pendingIntent";
export type { PendingIntent as PendingPlanIntent } from "./pendingIntent";
