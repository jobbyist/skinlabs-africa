import { useQuery } from "@tanstack/react-query";
import { analyzeRoutineConflicts } from "@/lib/conflictMatcher";
import type { GroundedRoutine } from "@/lib/skynnProductMatch";

/** Analyzes a saved SKYNN AI grounded routine for real ingredient conflicts/
 *  synergies. Only enabled once entitled (callers gate rendering via
 *  FeatureGate first) and once a routine with at least one real product exists. */
export function useConflictMatcher(routine: GroundedRoutine | null | undefined, enabled: boolean) {
  const hasProducts = !!routine && (routine.am.length > 0 || routine.pm.length > 0);
  return useQuery({
    queryKey: ["conflict-matcher", routine?.am.map((p) => p.product.id), routine?.pm.map((p) => p.product.id)],
    queryFn: () => analyzeRoutineConflicts(routine as GroundedRoutine),
    enabled: enabled && hasProducts,
    staleTime: 10 * 60 * 1000,
  });
}
