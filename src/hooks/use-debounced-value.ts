import { useEffect, useState } from "react";

/** Debounces a fast-changing value so expensive work (search scoring, network calls)
 *  doesn't re-run on every keystroke. */
export function useDebouncedValue<T>(value: T, delayMs = 150): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
