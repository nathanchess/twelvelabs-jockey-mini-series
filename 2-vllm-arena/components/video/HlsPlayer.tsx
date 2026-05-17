"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  type Ref,
  type VideoHTMLAttributes,
} from "react";

export type HlsPlayerHandle = {
  play: () => Promise<void>;
  pause: () => void;
  /** Seek to start without pausing (avoids interrupting an in-flight play()). */
  seekToStart: () => void;
};

function ignorePlayInterrupted(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") return;
  if (error instanceof Error && error.name === "AbortError") return;
}

type HlsPlayerProps = {
  manifestUrl: string;
  startSeconds?: number;
  endSeconds?: number;
  poster?: string | null;
  className?: string;
  muted?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  autoPlay?: boolean;
  playerRef?: Ref<HlsPlayerHandle>;
  videoRef?: Ref<HTMLVideoElement>;
} & Pick<VideoHTMLAttributes<HTMLVideoElement>, "onTimeUpdate">;

export function HlsPlayer({
  manifestUrl,
  startSeconds = 0,
  endSeconds,
  poster,
  className = "w-full rounded-lg bg-black",
  muted = false,
  playsInline = true,
  controls = true,
  autoPlay = false,
  playerRef,
  videoRef,
  onTimeUpdate,
}: HlsPlayerProps) {
  const internalVideoRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle(
    playerRef,
    () => ({
      play: async () => {
        const video = internalVideoRef.current;
        if (!video) return;
        try {
          await video.play();
        } catch (error) {
          ignorePlayInterrupted(error);
        }
      },
      pause: () => {
        internalVideoRef.current?.pause();
      },
      seekToStart: () => {
        const video = internalVideoRef.current;
        if (!video) return;
        video.currentTime = startSeconds > 0 ? startSeconds : 0;
      },
    }),
    [startSeconds]
  );

  useEffect(() => {
    const el = internalVideoRef.current;
    if (!el || !manifestUrl) return;

    const video = el;
    let hlsInstance: { destroy: () => void } | null = null;
    let cancelled = false;

    const seekToStart = () => {
      if (startSeconds > 0 && video.currentTime < startSeconds - 0.05) {
        video.currentTime = startSeconds;
      }
    };

    const onClipEnd = () => {
      if (endSeconds != null && video.currentTime >= endSeconds) {
        video.pause();
      }
    };

    async function attach() {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = manifestUrl;
        video.addEventListener("loadedmetadata", seekToStart);
        video.addEventListener("timeupdate", onClipEnd);
        if (autoPlay) void video.play().catch(ignorePlayInterrupted);
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
        if (autoPlay) void video.play().catch(ignorePlayInterrupted);
      });
      video.addEventListener("timeupdate", onClipEnd);
    }

    void attach();

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", seekToStart);
      video.removeEventListener("timeupdate", onClipEnd);
      hlsInstance?.destroy();
    };
  }, [manifestUrl, startSeconds, endSeconds, autoPlay]);

  return (
    <video
      ref={(node) => {
        internalVideoRef.current = node;
        if (typeof videoRef === "function") videoRef(node);
        else if (videoRef) videoRef.current = node;
      }}
      controls={controls}
      controlsList={
        controls
          ? "nodownload noremoteplayback"
          : "nodownload nofullscreen noremoteplayback noplaybackrate noaudio"
      }
      disablePictureInPicture
      disableRemotePlayback
      muted={muted}
      playsInline={playsInline}
      poster={poster ?? undefined}
      className={className}
      onTimeUpdate={onTimeUpdate}
    />
  );
}
