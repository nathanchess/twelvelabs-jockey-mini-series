"use client";

import { useRef, useState } from "react";
import type { CorpusVideo } from "@/lib/corpora";
import { formatDuration } from "@/lib/format";
import { useVideoMetadata } from "@/hooks/useVideoMetadata";

type VideoCardProps = {
  video: CorpusVideo;
};

export function VideoCard({ video }: VideoCardProps) {
  const duration = useVideoMetadata(video.src);
  const previewRef = useRef<HTMLVideoElement>(null);
  const [hovering, setHovering] = useState(false);
  const [progress, setProgress] = useState(0);

  function handleMouseEnter() {
    setHovering(true);
    const el = previewRef.current;
    if (!el) return;
    el.currentTime = 0;
    setProgress(0);
    void el.play().catch(() => {});
  }

  function handleMouseLeave() {
    setHovering(false);
    const el = previewRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setProgress(0);
  }

  return (
    <article className="w-[220px] shrink-0">
      <div
        className="relative aspect-video overflow-hidden rounded-xl bg-card"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <video
          src={video.src}
          className={`h-full w-full object-cover transition-opacity duration-200 ${
            hovering ? "opacity-0" : "opacity-100"
          }`}
          muted
          playsInline
          preload="metadata"
        />
        <video
          ref={previewRef}
          src={video.src}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
            hovering ? "opacity-100" : "opacity-0"
          }`}
          muted
          playsInline
          preload="metadata"
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            if (el.duration > 0) {
              setProgress(el.currentTime / el.duration);
            }
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-3">
          <span className="rounded-md border border-text-inverse/20 bg-brand-charcoal/90 px-2 py-0.5 font-mono text-sm font-medium text-text-inverse">
            {duration !== null ? formatDuration(duration) : "—"}
          </span>
        </div>
        {hovering && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-border-light">
            <div
              className="h-full bg-accent transition-[width] duration-75"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-text-primary">{video.title}</p>
    </article>
  );
}
