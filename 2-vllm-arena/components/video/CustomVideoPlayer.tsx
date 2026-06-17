"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { StrandIcon } from "@/components/strand/StrandIcon";
import { formatDuration } from "@/lib/format";

function ignorePlayInterrupted(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") return;
  if (error instanceof Error && error.name === "AbortError") return;
}

type CustomVideoPlayerProps = {
  src: string;
  poster?: string;
  title?: string;
  episodeLabel?: string;
  className?: string;
  onPlayStart?: () => void;
  onEnded?: () => void;
};

function FullscreenIcon({ exit = false }: { exit?: boolean }) {
  if (exit) {
    return (
      <svg
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden
      >
        <path d="M3 3h3v2H5v1H3V3zm7 0h3v3h-2V5h-1V3zM3 13v-3h2v1h1v2H3zm10-3v3h-3v-2h1v-1h2z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M2 2h5v5H2V2zm9 0h5v5h-5V2zM2 9h5v5H2V9zm9 0h5v5h-5V9z" />
    </svg>
  );
}

export function CustomVideoPlayer({
  src,
  poster,
  title,
  episodeLabel,
  className = "",
  onPlayStart,
  onEnded,
}: CustomVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [scrubbing, setScrubbing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hideControlsTimer = useRef<number | null>(null);

  const progress = duration > 0 ? currentTime / duration : 0;
  const bufferedProgress =
    duration > 0 && videoRef.current?.buffered.length
      ? videoRef.current.buffered.end(videoRef.current.buffered.length - 1) /
        duration
      : buffered;

  const clearHideTimer = useCallback(() => {
    if (hideControlsTimer.current != null) {
      window.clearTimeout(hideControlsTimer.current);
      hideControlsTimer.current = null;
    }
  }, []);

  const scheduleHideControls = useCallback(() => {
    clearHideTimer();
    if (!playing) return;
    hideControlsTimer.current = window.setTimeout(() => {
      setShowControls(false);
    }, 2400);
  }, [clearHideTimer, playing]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      setIsLoading(true);
      try {
        await video.play();
        if (!hasStarted) {
          setHasStarted(true);
          onPlayStart?.();
        }
      } catch (error) {
        ignorePlayInterrupted(error);
        setIsLoading(false);
      }
    } else {
      video.pause();
    }
  }, [hasStarted, onPlayStart]);

  const seekToFraction = useCallback(
    (fraction: number) => {
      const video = videoRef.current;
      if (!video || !duration) return;
      const next = Math.min(Math.max(fraction, 0), 1) * duration;
      video.currentTime = next;
      setCurrentTime(next);
    },
    [duration]
  );

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const track = timelineRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const fraction = (clientX - rect.left) / rect.width;
      seekToFraction(fraction);
    },
    [seekToFraction]
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      await container.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    setIsLoading(false);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasStarted(false);
    setShowControls(true);
  }, [src]);

  useEffect(() => {
    if (playing) scheduleHideControls();
    else {
      clearHideTimer();
      setShowControls(true);
    }
  }, [playing, scheduleHideControls, clearHideTimer]);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    switch (event.key) {
      case " ":
      case "k":
        event.preventDefault();
        void togglePlay();
        break;
      case "ArrowRight":
        event.preventDefault();
        video.currentTime = Math.min(
          video.currentTime + (event.shiftKey ? 10 : 5),
          duration || video.duration
        );
        break;
      case "ArrowLeft":
        event.preventDefault();
        video.currentTime = Math.max(
          video.currentTime - (event.shiftKey ? 10 : 5),
          0
        );
        break;
      case "m":
        toggleMute();
        break;
      case "f":
        void toggleFullscreen();
        break;
      default:
        break;
    }
  };

  const onTimelinePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    setScrubbing(true);
    seekFromClientX(event.clientX);
    revealControls();
  };

  useEffect(() => {
    if (!scrubbing) return;

    const onMove = (event: PointerEvent) => seekFromClientX(event.clientX);
    const onUp = () => setScrubbing(false);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [scrubbing, seekFromClientX]);

  return (
    <div
      ref={containerRef}
      className={`group relative aspect-video w-full overflow-hidden rounded-[20px] bg-brand-charcoal outline-none ${className}`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseMove={revealControls}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="h-full w-full object-contain"
        playsInline
        preload="none"
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration || 0);
          setIsLoading(false);
        }}
        onCanPlay={() => setIsLoading(false)}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          setCurrentTime(video.currentTime);
          if (video.buffered.length > 0 && video.duration > 0) {
            setBuffered(
              video.buffered.end(video.buffered.length - 1) / video.duration
            );
          }
        }}
        onPlay={() => {
          setPlaying(true);
          setIsLoading(false);
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setShowControls(true);
          onEnded?.();
        }}
        onClick={() => void togglePlay()}
      />

      {!playing && isLoading ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-brand-charcoal/50">
          <StrandIcon
            name="spinner"
            className="h-8 w-8 animate-spin text-text-inverse"
          />
        </div>
      ) : null}

      {!hasStarted && poster ? (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-charcoal/10 via-transparent to-brand-charcoal/75" />
      ) : null}

      {episodeLabel ? (
        <div
          className={`pointer-events-none absolute left-5 top-5 transition-opacity duration-200 ${
            showControls || !playing ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="inline-flex items-center rounded-md border border-text-inverse/20 bg-brand-charcoal/80 px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-text-inverse backdrop-blur-sm">
            {episodeLabel}
          </span>
        </div>
      ) : null}

      {!playing && !isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void togglePlay();
            }}
            className="flex h-16 w-16 items-center justify-center rounded-full border border-text-inverse/25 bg-surface/95 text-text-primary shadow-lg transition-[transform,background-color,border-radius] duration-200 hover:scale-105 hover:rounded-2xl hover:bg-surface"
            aria-label={title ? `Play ${title}` : "Play video"}
          >
            <StrandIcon name="play" className="h-7 w-7 translate-x-0.5" />
          </button>
        </div>
      ) : null}

      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-charcoal/95 via-brand-charcoal/70 to-transparent px-5 pb-4 pt-16 transition-opacity duration-200 ${
          showControls || !playing ? "opacity-100" : "opacity-0"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        {title ? (
          <p className="mb-3 line-clamp-1 font-brand text-base text-text-inverse">
            {title}
          </p>
        ) : null}

        <div
          ref={timelineRef}
          className="relative mb-3 h-2 cursor-pointer rounded-full bg-text-inverse/20"
          onPointerDown={onTimelinePointerDown}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-text-inverse/30"
            style={{ width: `${bufferedProgress * 100}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-product-generate"
            style={{ width: `${progress * 100}%` }}
          />
          <div
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-charcoal/20 bg-text-inverse shadow"
            style={{ left: `${progress * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void togglePlay()}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-inverse transition-[background-color,border-radius] duration-200 hover:rounded-xl hover:bg-text-inverse/10"
              aria-label={playing ? "Pause" : "Play"}
            >
              <StrandIcon
                name={playing ? "pause" : "play"}
                className="h-4 w-4"
              />
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-inverse transition-[background-color,border-radius] duration-200 hover:rounded-xl hover:bg-text-inverse/10"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              <StrandIcon
                name={muted || volume === 0 ? "volume-mute" : "volume-low"}
                className="h-4 w-4"
              />
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(event) => {
                const video = videoRef.current;
                const next = Number(event.target.value);
                if (!video) return;
                video.volume = next;
                video.muted = next === 0;
                setVolume(next);
                setMuted(next === 0);
              }}
              className="hidden h-1 w-20 accent-product-generate sm:block"
              aria-label="Volume"
            />

            <span className="font-mono text-xs text-text-inverse/90">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-inverse transition-[background-color,border-radius] duration-200 hover:rounded-xl hover:bg-text-inverse/10"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            <FullscreenIcon exit={isFullscreen} />
          </button>
        </div>
      </div>
    </div>
  );
}
