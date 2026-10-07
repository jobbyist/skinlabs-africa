import { ArrowRight, Loader2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Greeting, ResolvedAction } from "@/lib/context";

interface NextActionCardProps {
  greeting: Greeting;
  /** Tier / trial badge text shown quietly under the greeting. */
  badge?: React.ReactNode;
  primary: ResolvedAction | null;
  secondary: ResolvedAction[];
  loading?: boolean;
  busy?: boolean;
  /** Runs a non-link action (sign-up, trial, keep membership) and records the click. */
  onAction: (action: ResolvedAction) => void;
  /** "Not now" on a secondary suggestion; hides it for its cooldown, everywhere. */
  onDismiss?: (action: ResolvedAction) => void;
  /** The member's data couldn't be read: say so quietly instead of guessing what they should do. */
  unavailable?: boolean;
  onRetry?: () => void;
}

/**
 * Dashboard Home's one decision: where you are, and the single most useful thing to do
 * next, with at most two quieter follow-ups. Everything else on Home informs; this acts.
 * Which action shows is decided by src/lib/context (never in this component).
 */
const NextActionCard = ({ greeting, badge, primary, secondary, loading = false, busy = false, onAction, onDismiss, unavailable = false, onRetry }: NextActionCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6 sm:p-8" aria-busy="true" aria-label="Loading">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
          <Skeleton className="h-11 w-64 max-w-full" />
        </CardContent>
      </Card>
    );
  }

  const button = (a: ResolvedAction) =>
    a.kind === "link" && a.href ? (
      <Button asChild size="lg" className="min-h-11 w-full gap-2 whitespace-normal sm:w-auto">
        <Link to={a.href} onClick={() => onAction(a)}>
          {a.label}
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      </Button>
    ) : (
      <Button size="lg" className="min-h-11 w-full gap-2 whitespace-normal sm:w-auto" disabled={busy} onClick={() => onAction(a)}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {a.label}
        {!busy && <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
      </Button>
    );

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{greeting.title}</h1>
          {badge}
        </div>
        <p className="mt-1 text-sm text-secondary-text">{greeting.body}</p>

        {unavailable && (
          <p className="mt-4 text-sm text-muted-foreground" role="status">
            We couldn&apos;t load your latest activity just now.{" "}
            {onRetry && (
              <button type="button" onClick={onRetry} className="font-medium text-foreground underline underline-offset-4">
                Try again
              </button>
            )}
          </p>
        )}

        {primary && (
          <div className="mt-5">
            {button(primary)}
            {primary.reason && <p className="mt-2 text-sm text-muted-foreground">{primary.reason}</p>}
          </div>
        )}

        {secondary.length > 0 && (
          <ul className="mt-5 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:flex-wrap sm:gap-x-6" aria-label="Also useful right now">
            {secondary.map((a) => (
              <li key={a.id} className="flex min-w-0 items-center gap-1">
                {a.kind === "link" && a.href ? (
                  <Link
                    to={a.href}
                    onClick={() => onAction(a)}
                    className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    <span className="min-w-0 break-words">{a.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => onAction(a)}
                    className="inline-flex min-h-9 items-center gap-1.5 text-left text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    <span className="min-w-0 break-words">{a.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </button>
                )}
                {onDismiss && (
                  <button
                    type="button"
                    onClick={() => onDismiss(a)}
                    aria-label={`Not now: ${a.label}`}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9 sm:w-9"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default NextActionCard;
