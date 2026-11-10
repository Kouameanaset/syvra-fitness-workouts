// A CUSTOM HOOK. A hook is a function whose name starts with "use" and that
// can call other hooks (useState, useEffect...). Custom hooks let us share
// logic between components: every page needs "load data, show loading, show
// error, allow retry", so we write it once here.

import { useCallback, useEffect, useRef, useState } from "react";
import type { DependencyList } from "react";

export interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Runs `fetcher` when the component appears and again whenever a value in
 * `deps` changes (like the selected muscle group or the id in the URL).
 */
export function useFetch<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList = [],
): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Changing this counter re-runs the effect: that is how reload() works.
  const [reloadCount, setReloadCount] = useState(0);

  // Keep the latest fetcher in a ref. Pages pass a new arrow function on
  // every render; if we listed it in the effect's dependencies, the effect
  // would re-run forever. A ref always holds the newest one without that.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // useEffect runs code AFTER React has drawn the screen. Fetching data is a
  // "side effect" (it talks to the outside world), so it belongs here and not
  // in the render body.
  useEffect(() => {
    // Set to true by the cleanup function below. When it is true, the answer
    // we are waiting for is out of date: the component was removed, or the
    // deps changed and a newer request replaced this one.
    let ignore = false;

    setLoading(true);
    setError(null);

    fetcherRef
      .current()
      .then((result) => {
        if (!ignore) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
          setLoading(false);
        }
      });

    // The function returned by an effect is its cleanup. React calls it
    // before running the effect again and when the component unmounts.
    return () => {
      ignore = true;
    };
    // The deps are chosen by the caller, so the linter cannot check them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadCount]);

  // useCallback keeps the same function between renders (stable identity).
  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return { data, loading, error, reload };
}
