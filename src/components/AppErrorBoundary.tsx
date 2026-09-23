import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { isChunkLoadError, reloadForNewDeployment } from "@/lib/chunkRecovery";

interface AppErrorBoundaryProps {
  children: ReactNode;
  /** When this value changes (e.g. the route path), a caught error is cleared. */
  resetKey?: string;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

/**
 * Last line of defence so a render error never leaves a blank or half-drawn
 * page. Chunk-load errors (a stale tab after a deploy) trigger one guarded
 * reload first; anything else shows a recoverable fallback instead of
 * unmounting the whole app.
 */
class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (isChunkLoadError(error) && reloadForNewDeployment()) return;
    console.error("[AppErrorBoundary]", error, info.componentStack);
  }

  componentDidUpdate(prevProps: AppErrorBoundaryProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-background px-6 py-24 text-center">
        <p className="font-heading text-2xl font-bold text-foreground">This page didn’t load properly</p>
        <p className="max-w-md text-sm text-muted-foreground">
          SkinLabs may have just been updated. Reloading will fetch the latest version.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Reload page
          </button>
          <a href="/" className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent">
            Go to homepage
          </a>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
