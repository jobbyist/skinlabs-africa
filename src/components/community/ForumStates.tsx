import { AlertTriangle, EyeOff, MessageSquarePlus, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ConnectionState } from "@/hooks/use-community";

export const FeedSkeleton = () => (
  <div className="space-y-4" role="status" aria-label="Loading discussions">
    {[0, 1, 2].map((i) => (
      <div key={i} className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="mt-4 h-5 w-4/5" />
        <Skeleton className="mt-3 h-3.5 w-full" />
        <Skeleton className="mt-2 h-3.5 w-2/3" />
        <Skeleton className="mt-5 h-8 w-full" />
      </div>
    ))}
  </div>
);

export const CommentsSkeleton = () => (
  <div className="space-y-4 py-2" role="status" aria-label="Loading comments">
    {[0, 1].map((i) => (
      <div key={i} className="flex gap-3">
        <Skeleton className="size-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-full" />
        </div>
      </div>
    ))}
  </div>
);

interface StateProps {
  onAction?: () => void;
  actionLabel?: string;
}

export const FeedEmpty = ({ onAction, filtered }: StateProps & { filtered?: boolean }) => (
  <div className="rounded-3xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
    <MessageSquarePlus className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
    <h2 className="mt-4 font-heading text-lg font-semibold">{filtered ? "Nothing here yet" : "No discussions yet"}</h2>
    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
      {filtered ? "Be the first to start a conversation in this topic." : "Start the first conversation. Ask about a routine, a product or what's working for your skin."}
    </p>
    {onAction && (
      <Button onClick={onAction} className="mt-5">
        Start a discussion
      </Button>
    )}
  </div>
);

export const FeedError = ({ onAction, message }: StateProps & { message?: string }) => (
  <div role="alert" className="rounded-3xl border border-border bg-card px-6 py-12 text-center">
    <AlertTriangle className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
    <h2 className="mt-4 font-heading text-lg font-semibold">We couldn't load the community</h2>
    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{message ?? "Check your connection and try again. Your drafts and likes are safe."}</p>
    {onAction && (
      <Button variant="outline" onClick={onAction} className="mt-5">
        <RefreshCw className="mr-2 size-4" aria-hidden="true" />
        Try again
      </Button>
    )}
  </div>
);

export const PostUnavailable = ({ onAction }: StateProps) => (
  <div className="px-2 py-12 text-center">
    <EyeOff className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
    <h3 className="mt-4 font-heading text-lg font-semibold">This discussion isn't available</h3>
    <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">It may have been removed by its author or a moderator, or the link may be out of date.</p>
    {onAction && (
      <Button variant="outline" onClick={onAction} className="mt-5">
        Back to the community
      </Button>
    )}
  </div>
);

export const ConnectionBanner = ({ state }: { state: ConnectionState }) =>
  state === "reconnecting" ? (
    <div role="status" className="flex items-center gap-2 rounded-2xl border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground">
      <WifiOff className="size-4 shrink-0" aria-hidden="true" />
      Live updates paused. Reconnecting — you may be missing the newest activity.
    </div>
  ) : null;
