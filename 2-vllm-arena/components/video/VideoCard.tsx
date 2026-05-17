"use client";

import { useEffect, useRef, useState } from "react";
import type { CorpusVideo } from "@/lib/corpora";
import { formatDuration } from "@/lib/format";
import { HlsPlayer, type HlsPlayerHandle } from "@/components/video/HlsPlayer";
import { useAssetPlayback } from "@/hooks/useAssetPlayback";

type VideoCardProps = {
  video: CorpusVideo;
  playbackAssetId: string;
  onOpenPreview: () => void;
};

export function VideoCard({
  video,
  playbackAssetId,
  onOpenPreview,
}: VideoCardProps) {
  const { manifestUrl, thumbnailUrl, duration, loading, error } =
    useAssetPlayback(playbackAssetId);
  const playerRef = useRef<HlsPlayerHandle>(null);
  const [hovering, setHovering] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!hovering || !manifestUrl) return;

    let cancelled = false;
    let frame = 0;

    const startPreview = () => {
      if (cancelled) return;
      const player = playerRef.current;
      if (!player) {
        frame = requestAnimationFrame(startPreview);
        return;
      }
      player.seekToStart();
      void player.play();
    };

    startPreview();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      playerRef.current?.pause();
      playerRef.current?.seekToStart();
    };
  }, [hovering, manifestUrl]);

  return (
    <article className="w-[220px] shrink-0">
      <button
        type="button"
        className="relative block w-full cursor-pointer overflow-hidden rounded-xl border-0 bg-card p-0 text-left aspect-video"
        onMouseEnter={() => {
          setHovering(true);
          setProgress(0);
        }}
        onMouseLeave={() => {
          setHovering(false);
          setProgress(0);
        }}
        onClick={onOpenPreview}
        aria-label={`Open ${video.title}`}
      >
        {loading ? (
          <div className="h-full w-full animate-pulse bg-card" />
        ) : error ? (
          <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-text-tertiary">
            {error}
          </div>
        ) : (
          <>
            {!hovering && thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- TwelveLabs CDN poster
              <img
                src={thumbnailUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
            {manifestUrl ? (
              <HlsPlayer
                playerRef={playerRef}
                manifestUrl={manifestUrl}
                poster={thumbnailUrl}
                className={`video-card-preview absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
                  hovering ? "opacity-100" : "opacity-0"
                }`}
                muted
                playsInline
                controls={false}
                autoPlay={false}
                onTimeUpdate={(e) => {
                  const el = e.currentTarget;
                  if (el.duration > 0) {
                    setProgress(el.currentTime / el.duration);
                  }
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-text-tertiary">
                Stream not ready
              </div>
            )}
          </>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-3">
          <span className="rounded-md border border-text-inverse/20 bg-brand-charcoal/90 px-2 py-0.5 font-mono text-sm font-medium text-text-inverse">
            {duration !== null ? formatDuration(duration) : "—"}
          </span>
        </div>
        {hovering && manifestUrl ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-border-light">
            <div
              className="h-full bg-accent transition-[width] duration-75"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        ) : null}
      </button>
      <p className="mt-2 line-clamp-2 text-sm text-text-primary">{video.title}</p>
    </article>
  );
}
