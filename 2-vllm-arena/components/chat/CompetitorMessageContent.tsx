"use client";

import type { CorpusVideo } from "@/lib/corpora";
import { StreamingCursor } from "@/components/chat/StreamingCursor";

type CompetitorMessageContentProps = {
  content: string;
  sourceVideo?: CorpusVideo;
  streaming?: boolean;
};

export function CompetitorMessageContent({
  content,
  sourceVideo,
  streaming,
}: CompetitorMessageContentProps) {
  return (
    <div className="space-y-3">
      {sourceVideo ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <video
            src={sourceVideo.src}
            className="aspect-video w-full min-h-[220px] max-h-[280px] bg-black object-cover"
            muted
            playsInline
            preload="metadata"
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
