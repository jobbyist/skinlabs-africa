import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/hooks/use-app-context";
import { emptyStateCopy, type EmptyStateKind } from "@/lib/context";

/**
 * An empty state that points at the logical next step for THIS member (src/lib/context/copy.ts)
 * instead of repeating navigation. Falls back to the same copy for a signed-out render.
 */
const ContextualEmptyState = ({ kind }: { kind: EmptyStateKind }) => {
  const { facts } = useAppContext();
  const copy = emptyStateCopy(kind, facts);
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center">
      <p className="font-heading text-base font-semibold text-foreground">{copy.title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{copy.body}</p>
      {copy.action?.href && (
        <Button asChild className="mt-4 min-h-11">
          <Link to={copy.action.href}>{copy.action.label}</Link>
        </Button>
      )}
    </div>
  );
};

export default ContextualEmptyState;
