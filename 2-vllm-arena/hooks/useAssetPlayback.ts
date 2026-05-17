"use client";

import { useEffect, useState } from "react";

type AssetPlayback = {
  manifestUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  loading: boolean;
  error: string | null;
};

const EMPTY: AssetPlayback = {
  manifestUrl: null,
  thumbnailUrl: null,
  duration: null,
  loading: false,
  error: null,
};

export function useAssetPlayback(assetId: string | null | undefined): AssetPlayback {
  const [state, setState] = useState<AssetPlayback>(EMPTY);

  useEffect(() => {
    if (!assetId) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState({ ...EMPTY, loading: true });

    fetch(`/api/assets/${encodeURIComponent(assetId)}`)
      .then((res) =>
        res.ok ? res.json() : res.json().then((body) => Promise.reject(body))
      )
      .then(
        (data: {
          manifestUrl?: string | null;
          thumbnailUrl?: string | null;
          duration?: number | null;
        }) => {
          if (cancelled) return;
          setState({
            manifestUrl: data.manifestUrl ?? null,
            thumbnailUrl: data.thumbnailUrl ?? null,
            duration:
              typeof data.duration === "number" && Number.isFinite(data.duration)
                ? data.duration
                : null,
            loading: false,
            error: null,
          });
        }
      )
      .catch((err: { error?: string }) => {
        if (cancelled) return;
        setState({
          ...EMPTY,
          error: err?.error ?? "Could not load video asset.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [assetId]);

  return state;
}
