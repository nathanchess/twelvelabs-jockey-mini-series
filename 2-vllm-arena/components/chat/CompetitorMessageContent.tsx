"use client";

import type { CorpusVideo } from "@/lib/corpora";
import { CorpusVideoSurface } from "@/components/video/CorpusVideoSurface";
import { StreamingCursor } from "@/components/chat/StreamingCursor";

type CompetitorMessageContentProps = {
  content: string;
  sourceVideo?: CorpusVideo;
  sourcePlaybackAssetId?: string;
  streaming?: boolean;
};

export function CompetitorMessageContent({
  content,
  sourceVideo,
  sourcePlaybackAssetId,
  streaming,
}: CompetitorMessageContentProps) {
  return (
    <div className="space-y-3">
      {sourceVideo && sourcePlaybackAssetId ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <CorpusVideoSurface
            playbackAssetId={sourcePlaybackAssetId}
            className="aspect-video w-full min-h-[220px] max-h-[280px] bg-black object-cover"
            muted
            playsInline
            controls
          />
          <div className="border-t border-border px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
              Source video (1 of corpus)
            </p>
            <p className="truncate text-sm font-medium text-text-primary">
              {sourceVideo.title}
            </p>
          </div>
        </div>
      ) : null}

      <p className="whitespace-pre-wrap break-words">
        {content}
        {streaming ? <StreamingCursor /> : null}
      </p>
    </div>
  );
}
