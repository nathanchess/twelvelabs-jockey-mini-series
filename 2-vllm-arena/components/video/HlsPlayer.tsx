"use client";

import { useEffect, useRef } from "react";

type HlsPlayerProps = {
  manifestUrl: string;
  startSeconds?: number;
  endSeconds?: number;
  poster?: string | null;
  className?: string;
};

export function HlsPlayer({
  manifestUrl,
  startSeconds = 0,
  endSeconds,
  poster,
  className = "w-full rounded-lg bg-black",
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !manifestUrl) return;

    const video = el;
    let hlsInstance: { destroy: () => void } | null = null;
    let cancelled = false;

    const seekToStart = () => {
      if (startSeconds > 0 && video.currentTime < startSeconds - 0.05) {
        video.currentTime = startSeconds;
      }
    };

    const onTimeUpdate = () => {
      if (endSeconds != null && video.currentTime >= endSeconds) {
        video.pause();
      }
    };

    async function attach() {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = manifestUrl;
        video.addEventListener("loadedmetadata", seekToStart);
        video.addEventListener("timeupdate", onTimeUpdate);
        return;
      }

      const { default: Hls } = await import("hls.js");
      if (cancelled || !Hls.isSupported()) return;

      const hls = new Hls();
      hlsInstance = hls;
      hls.loadSource(manifestUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        seekToStart();
        void video.play().catch(() => undefined);
      });
      video.addEventListener("timeupdate", onTimeUpdate);
    }

    void attach();

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", seekToStart);
      video.removeEventListener("timeupdate", onTimeUpdate);
      hlsInstance?.destroy();
    };
  }, [manifestUrl, startSeconds, endSeconds]);

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      poster={poster ?? undefined}
      className={className}
    />
  );
}
