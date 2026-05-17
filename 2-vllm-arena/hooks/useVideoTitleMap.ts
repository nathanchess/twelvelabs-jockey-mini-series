"use client";

import { useEffect, useState } from "react";
import type { AssetIdMap } from "@/lib/asset-id-map";
import type { VideoTitleMap } from "@/lib/vref";

export function useVideoTitleMap() {
  const [titleMap, setTitleMap] = useState<VideoTitleMap>({});
  const [assetIdMap, setAssetIdMap] = useState<AssetIdMap>({});
  const [videoCount, setVideoCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/knowledge-store/items")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(
        (data: {
          titleMap?: VideoTitleMap;
          assetIdMap?: AssetIdMap;
          videoCount?: number;
        }) => {
          if (cancelled) return;
          if (data.titleMap) setTitleMap(data.titleMap);
          if (data.assetIdMap) setAssetIdMap(data.assetIdMap);
          if (typeof data.videoCount === "number") setVideoCount(data.videoCount);
        }
      )
      .catch(() => {
        /* optional — fall back to short ids */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { titleMap, assetIdMap, videoCount, loading };
}
