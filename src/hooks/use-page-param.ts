import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Syncs a 1-indexed page number to a URL search param (default "page") so paginated
 * listings are deep-linkable and crawlable — e.g. /newsroom?page=2 — instead of only
 * reachable via client-side state. Page 1 omits the param entirely for a clean canonical.
 */
export function usePageParam(paramName = "page"): [number, (page: number) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = Number.parseInt(searchParams.get(paramName) ?? "1", 10);
  const page = Number.isFinite(raw) && raw > 0 ? raw : 1;

  const setPage = useCallback(
    (next: number) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next <= 1) params.delete(paramName);
          else params.set(paramName, String(next));
          return params;
        },
        { replace: false },
      );
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [setSearchParams, paramName],
  );

  return [page, setPage];
}
