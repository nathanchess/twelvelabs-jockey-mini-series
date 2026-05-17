"use client";

import { useState } from "react";
import {
  corpusList,
  corpora,
  defaultCorpusId,
  type Corpus,
} from "@/lib/corpora";
import { lookupCorpusPlaybackAssetId } from "@/lib/corpus-video";
import type { AssetIdMap } from "@/lib/asset-id-map";
import { MinimalSelect } from "@/components/strand/MinimalSelect";
import { StrandIcon } from "@/components/strand/StrandIcon";
import { VideoCard } from "./VideoCard";
import {
  VideoPreviewModal,
  type VideoPreviewRequest,
} from "@/components/video/VideoPreviewModal";

type VideoCorpusBarProps = {
  assetIdMap: AssetIdMap;
};

export function VideoCorpusBar({ assetIdMap }: VideoCorpusBarProps) {
  const [corpusId, setCorpusId] = useState(defaultCorpusId);
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState<VideoPreviewRequest | null>(null);
  const corpus: Corpus = corpora[corpusId] ?? corpora[defaultCorpusId];

  return (
    <section className="border-b border-border px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MinimalSelect
            options={corpusList.map((c) => ({ id: c.id, label: c.label }))}
            value={corpusId}
            onChange={setCorpusId}
          />
          <span className="text-sm font-medium text-text-tertiary">
            {corpus.videos.length} videos
          </span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-2 rounded-md border border-border-light px-3 py-1.5 text-sm font-medium text-text-secondary transition-[border-radius,background-color] duration-200 hover:rounded-lg hover:bg-card hover:text-text-primary"
          aria-expanded={expanded}
        >
          <StrandIcon
            name={expanded ? "collapse" : "expand"}
            className="h-4 w-4"
          />
          {expanded ? "Hide videos" : "Show videos"}
        </button>
      </div>

      <div
        className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out ${
          expanded
            ? "mt-4 grid-rows-[1fr] opacity-100"
            : "mt-0 grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div
            key={expanded ? `videos-${corpusId}` : "videos-collapsed"}
            className="video-cards-stagger flex gap-4 overflow-x-auto pb-2"
          >
            {corpus.videos.map((video, index) => {
              const playbackAssetId = lookupCorpusPlaybackAssetId(
                video,
                assetIdMap
              );

              return (
                <div
                  key={video.id}
                  style={{ animationDelay: `${index * 55}ms` }}
                >
                  {playbackAssetId ? (
                    <VideoCard
                      video={video}
                      playbackAssetId={playbackAssetId}
                      onOpenPreview={() =>
                        setPreview({
                          assetId: playbackAssetId,
                          title: video.title,
                        })
                      }
                    />
                  ) : (
                    <article className="w-[220px] shrink-0">
                      <div className="flex aspect-video items-center justify-center rounded-xl bg-card px-2 text-center text-xs text-text-tertiary">
                        No TwelveLabs asset for this clip
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-text-primary">
                        {video.title}
                      </p>
                    </article>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <VideoPreviewModal request={preview} onClose={() => setPreview(null)} />
    </section>
  );
}
