"use client";

import { useCallback, useEffect, useState } from "react";
import { HlsPlayer } from "@/components/video/HlsPlayer";
import { StrandIcon } from "@/components/strand/StrandIcon";
import { parseTimeToSeconds } from "@/lib/jockey-content";

export type VideoPreviewRequest = {
  assetId: string;
  title: string;
  start?: string;
  end?: string;
};

type AssetPayload = {
  id: string;
  filename: string | null;
  duration: number | null;
  manifestUrl: string | null;
  hlsStatus: string | null;
  thumbnailUrl: string | null;
  status: string | null;
};

type VideoPreviewModalProps = {
  request: VideoPreviewRequest | null;
  onClose: () => void;
};

export function VideoPreviewModal({ request, onClose }: VideoPreviewModalProps) {
  const [asset, setAsset] = useState<AssetPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!request) {
      setAsset(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setAsset(null);

    fetch(`/api/assets/${encodeURIComponent(request.assetId)}`)
      .then((res) =>
        res.ok ? res.json() : res.json().then((b) => Promise.reject(b))
      )
      .then((data: AssetPayload) => {
        if (!cancelled) setAsset(data);
      })
      .catch((err: { error?: string }) => {
        if (!cancelled) {
          setError(err?.error ?? "Could not load video asset.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [request]);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!request) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [request, onClose]);

  if (!request) return null;

  const startSeconds = request.start
    ? parseTimeToSeconds(request.start)
    : undefined;
  const endSeconds = request.end ? parseTimeToSeconds(request.end) : undefined;
  const displayTitle = request.title || asset?.filename || request.assetId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-preview-title"
      onClick={handleBackdrop}
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2
              id="video-preview-title"
              className="truncate text-[15px] font-medium text-text-primary"
            >
              {displayTitle}
            </h2>
            {request.start && request.end ? (
              <p className="text-xs text-text-tertiary">
                {request.start}–{request.end}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-light text-text-secondary transition-colors hover:bg-card hover:text-text-primary"
            aria-label="Close preview"
          >
            <StrandIcon name="close" className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="py-12 text-center text-sm text-text-tertiary">
              Loading video…
            </p>
          ) : error ? (
            <p className="py-12 text-center text-sm text-text-secondary">
              {error}
            </p>
          ) : asset?.manifestUrl ? (
            <HlsPlayer
              manifestUrl={asset.manifestUrl}
              startSeconds={startSeconds}
              endSeconds={endSeconds}
              poster={asset.thumbnailUrl}
            />
          ) : (
            <p className="py-12 text-center text-sm text-text-secondary">
              Video stream is not ready for this asset.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
