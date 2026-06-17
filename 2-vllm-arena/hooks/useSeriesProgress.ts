"use client";

import { useCallback, useState } from "react";

export function useSeriesProgress() {
  const [watched, setWatched] = useState<Set<string>>(() => new Set());

  const markWatched = useCallback((episodeId: string) => {
    setWatched((prev) => {
      if (prev.has(episodeId)) return prev;
      const next = new Set(prev);
      next.add(episodeId);
      return next;
    });
  }, []);

  const isWatched = useCallback(
    (episodeId: string) => watched.has(episodeId),
    [watched]
  );

  const watchedCount = watched.size;

  return { watchedCount, isWatched, markWatched };
}
