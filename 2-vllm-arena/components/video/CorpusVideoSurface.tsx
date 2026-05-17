"use client";

import { useEffect, type VideoHTMLAttributes } from "react";
import { HlsPlayer } from "@/components/video/HlsPlayer";
import { useAssetPlayback } from "@/hooks/useAssetPlayback";

type CorpusVideoSurfaceProps = {
  playbackAssetId: string;
  className?: string;
  onDurationKnown?: (duration: number) => void;
} & Pick<
  VideoHTMLAttributes<HTMLVideoElement>,
  "muted" | "playsInline" | "controls" | "onTimeUpdate"
> & {
    autoPlay?: boolean;
  };

export function CorpusVideoSurface({
  playbackAssetId,
  className,
  onDurationKnown,
  muted,
  playsInline,
  controls = true,
  autoPlay = false,
  onTimeUpdate,
}: CorpusVideoSurfaceProps) {
  const { manifestUrl, thumbnailUrl, duration, loading, error } =
    useAssetPlayback(playbackAssetId);

  useEffect(() => {
    if (duration != null) onDurationKnown?.(duration);
  }, [duration, onDurationKnown]);

  if (loading) {
    return <VideoPlaceholder className={className} aria-label="Loading video" />;
  }

  if (error) {
    return (
      <VideoPlaceholder className={className}>
        <span className="px-3 text-center text-xs text-text-tertiary">{error}</span>
      </VideoPlaceholder>
    );
  }

  if (!manifestUrl) {
    return (
      <VideoPlaceholder className={className}>
        <span className="px-3 text-center text-xs text-text-tertiary">
          Video stream is not ready for this asset.
        </span>
      </VideoPlaceholder>
    );
  }

  return (
    <HlsPlayer
      manifestUrl={manifestUrl}
      poster={thumbnailUrl}
      className={className}
      muted={muted}
      playsInline={playsInline}
      controls={controls}
      autoPlay={autoPlay}
      onTimeUpdate={onTimeUpdate}
    />
  );
}

function VideoPlaceholder({
  className,
  children,
  ...props
}: {
  className?: string;
  children?: React.ReactNode;
  "aria-label"?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center bg-card ${className ?? ""} ${!children ? "animate-pulse" : ""}`}
      aria-hidden={!props["aria-label"] && !children}
      {...props}
    >
      {children}
    </div>
  );
}
