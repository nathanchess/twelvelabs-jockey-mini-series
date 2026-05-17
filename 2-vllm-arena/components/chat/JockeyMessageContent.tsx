"use client";

import { useCallback, useMemo, useState } from "react";
import {
  assetDisplayTitle,
  parseJockeyContent,
} from "@/lib/jockey-content";
import { parseJockeyMarkdown, type MarkedAssetRef } from "@/lib/jockey-markdown";
import { resolvePlaybackAssetId, type AssetIdMap } from "@/lib/asset-id-map";
import type { VideoTitleMap } from "@/lib/vref";
import { JockeyMarkdown } from "@/components/chat/JockeyMarkdown";
import { StreamingCursor } from "@/components/chat/StreamingCursor";
import {
  VideoPreviewModal,
  type VideoPreviewRequest,
} from "@/components/video/VideoPreviewModal";

type JockeyMessageContentProps = {
  content: string;
  videoTitleMap: VideoTitleMap;
  assetIdMap?: AssetIdMap;
  streaming?: boolean;
};

export function JockeyMessageContent({
  content,
  videoTitleMap,
  assetIdMap = {},
  streaming,
}: JockeyMessageContentProps) {
  const [preview, setPreview] = useState<VideoPreviewRequest | null>(null);

  const segments = useMemo(() => parseJockeyContent(content), [content]);
  const { blocks, assetRefs } = useMemo(
    () => parseJockeyMarkdown(segments),
    [segments]
  );

  const renderAsset = useCallback(
    (ref: MarkedAssetRef, key: string) => {
      const title = assetDisplayTitle(ref.assetId, videoTitleMap);
      const playbackAssetId = resolvePlaybackAssetId(ref.assetId, assetIdMap);
      const range =
        ref.start && ref.end ? ` (${ref.start}–${ref.end})` : "";

      return (
        <span key={key}>
          <button
            type="button"
            onClick={() =>
              setPreview({
                assetId: playbackAssetId,
                title,
                start: ref.start,
                end: ref.end,
              })
            }
            className="asset-ref-link"
          >
            {title}
          </button>
          {range ? (
            <span className="text-text-secondary">{range}</span>
          ) : null}
        </span>
      );
    },
    [videoTitleMap, assetIdMap]
  );

  return (
    <>
      <JockeyMarkdown
        blocks={blocks}
        assetRefs={assetRefs}
        renderAsset={renderAsset}
      />
      {streaming ? (
        <p className="mt-1">
          <StreamingCursor />
        </p>
      ) : null}

      <VideoPreviewModal request={preview} onClose={() => setPreview(null)} />
    </>
  );
}
