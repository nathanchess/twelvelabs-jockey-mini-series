"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { StrandButton } from "@/components/strand/StrandButton";
import { StrandIcon } from "@/components/strand/StrandIcon";
import { SeriesEpisodePlayer } from "@/components/series/SeriesEpisodePlayer";
import { useSeriesProgress } from "@/hooks/useSeriesProgress";
import {
  SERIES_EPISODES,
  youtubeWatchUrl,
  type SeriesEpisode,
} from "@/lib/series-episodes";

const LEARNING_STEPS = [
  {
    id: "episode-1",
    label: "Build your corpus",
    description: "Knowledge Stores & asset fundamentals",
    episodeNumber: 1,
  },
  {
    id: "episode-2",
    label: "Benchmark Jockey",
    description: "Compare against standard VLMs",
    episodeNumber: 2,
  },
  {
    id: "arena",
    label: "Try the Arena",
    description: "Run side-by-side prompts live",
    href: "/arena",
  },
] as const;

function EpisodeCard({
  episode,
  active,
  watched,
  onSelect,
}: {
  episode: SeriesEpisode;
  active: boolean;
  watched: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full flex-col gap-2 rounded-xl border p-4 text-left transition-[background-color,border-color,box-shadow] duration-200 ${
        active
          ? "border-brand-charcoal bg-card shadow-sm"
          : "border-border-light bg-surface hover:border-border hover:bg-card/60"
      }`}
      aria-current={active ? "true" : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`font-mono text-xs uppercase tracking-wide ${
            active ? "text-text-primary" : "text-text-tertiary"
          }`}
        >
          Episode {episode.number}
        </span>
        {watched ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-accent-light px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
            <StrandIcon name="checkmark" className="h-3 w-3" />
            Watched
          </span>
        ) : null}
      </div>
      <p className="font-brand text-[15px] leading-snug text-text-primary">
        {episode.title}
      </p>
      <p className="line-clamp-2 text-sm text-text-secondary">
        {episode.summary}
      </p>
    </button>
  );
}

export function SeriesLearningSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [highlightedTopic, setHighlightedTopic] = useState<string | null>(null);
  const { watchedCount, isWatched, markWatched } = useSeriesProgress();

  const activeEpisode = SERIES_EPISODES[activeIndex];
  const nextEpisode =
    activeIndex < SERIES_EPISODES.length - 1
      ? SERIES_EPISODES[activeIndex + 1]
      : null;

  const completedEpisodeNumbers = useMemo(
    () =>
      SERIES_EPISODES.filter((ep) => isWatched(ep.id)).map((ep) => ep.number),
    [isWatched]
  );

  const selectEpisode = useCallback((index: number) => {
    setActiveIndex(index);
    setHighlightedTopic(null);
  }, []);

  const goToNextEpisode = useCallback(() => {
    if (nextEpisode) {
      selectEpisode(activeIndex + 1);
    }
  }, [activeIndex, nextEpisode, selectEpisode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key === "ArrowRight" || event.key === "j") {
        if (activeIndex < SERIES_EPISODES.length - 1) {
          event.preventDefault();
          selectEpisode(activeIndex + 1);
        }
      }

      if (event.key === "ArrowLeft" || event.key === "k") {
        if (activeIndex > 0) {
          event.preventDefault();
          selectEpisode(activeIndex - 1);
        }
      }

      const num = Number(event.key);
      if (num >= 1 && num <= SERIES_EPISODES.length) {
        event.preventDefault();
        selectEpisode(num - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, selectEpisode]);

  return (
    <section className="mx-auto w-full max-w-[1200px] px-8 pb-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-section-label mb-2">Mini-series</p>
          <h2 className="text-header-lg">Learn Jockey in two episodes</h2>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary">
            Watch the walkthroughs, then jump into the Arena to compare Jockey
            against leading video-language models on your own prompts.
          </p>
        </div>
        <div className="rounded-xl border border-border-light bg-card px-4 py-3">
          <p className="font-mono text-xs uppercase tracking-wide text-text-tertiary">
            Progress
          </p>
          <p className="mt-1 text-lg font-medium text-text-primary">
            {watchedCount}{" "}
            <span className="text-sm font-normal text-text-secondary">
              of {SERIES_EPISODES.length} watched
            </span>
          </p>
        </div>
      </div>

      <ol className="mb-8 grid gap-3 sm:grid-cols-3">
        {LEARNING_STEPS.map((step, index) => {
          const episodeDone =
            "episodeNumber" in step
              ? completedEpisodeNumbers.includes(step.episodeNumber)
              : watchedCount >= SERIES_EPISODES.length;
          const isCurrent =
            "episodeNumber" in step
              ? step.episodeNumber === activeEpisode.number
              : watchedCount >= SERIES_EPISODES.length;

          const content = (
            <>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs ${
                  episodeDone
                    ? "bg-accent text-text-inverse"
                    : isCurrent
                      ? "bg-brand-charcoal text-text-inverse"
                      : "bg-card text-text-secondary"
                }`}
              >
                {episodeDone ? (
                  <StrandIcon name="checkmark" className="h-3.5 w-3.5" />
                ) : (
                  index + 1
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">
                  {step.label}
                </p>
                <p className="text-xs text-text-tertiary">{step.description}</p>
              </div>
            </>
          );

          if ("href" in step) {
            return (
              <li key={step.id}>
                <a
                  href={step.href}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors duration-200 ${
                    episodeDone
                      ? "border-accent/40 bg-accent-light/40 hover:bg-accent-light/70"
                      : "border-border-light bg-surface hover:border-border hover:bg-card/50"
                  }`}
                >
                  {content}
                  <StrandIcon
                    name="arrow-diagonal"
                    className="ml-auto h-4 w-4 shrink-0 text-text-tertiary"
                  />
                </a>
              </li>
            );
          }

          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => selectEpisode(step.episodeNumber - 1)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-200 ${
                  isCurrent
                    ? "border-brand-charcoal bg-card"
                    : "border-border-light bg-surface hover:border-border hover:bg-card/50"
                }`}
              >
                {content}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <SeriesEpisodePlayer
            key={activeEpisode.id}
            episode={activeEpisode}
            onStarted={() => markWatched(activeEpisode.id)}
            onEnded={() => markWatched(activeEpisode.id)}
          />
          <p className="mt-2 text-xs text-text-tertiary">
            Keyboard: <kbd className="font-mono">1</kbd>/
            <kbd className="font-mono">2</kbd> switch episodes,{" "}
            <kbd className="font-mono">←</kbd>/<kbd className="font-mono">→</kbd>{" "}
            prev/next
          </p>
        </div>

        <aside className="flex flex-col gap-3">
          <p className="text-section-label">Episodes</p>
          {SERIES_EPISODES.map((episode, index) => (
            <EpisodeCard
              key={episode.id}
              episode={episode}
              active={index === activeIndex}
              watched={isWatched(episode.id)}
              onSelect={() => selectEpisode(index)}
            />
          ))}
        </aside>
      </div>

      <article className="mt-8 rounded-2xl border border-border-light bg-surface p-6 lg:p-8">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-section-label mb-1">
              Episode {activeEpisode.number}
            </p>
            <h3 className="font-brand text-xl leading-snug text-text-primary">
              {activeEpisode.title}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <StrandButton
              variant="black-outline"
              size="small"
              href={youtubeWatchUrl(activeEpisode.youtubeId)}
              external
            >
              Watch on YouTube
              <StrandIcon name="arrow-diagonal" className="h-3.5 w-3.5" />
            </StrandButton>
            <StrandButton
              variant="highlight"
              size="small"
              href={activeEpisode.cta.href}
              external={activeEpisode.cta.external}
            >
              {activeEpisode.cta.label}
              <StrandIcon name="arrow-diagonal" className="h-3.5 w-3.5" />
            </StrandButton>
          </div>
        </div>

        <p className="mb-6 max-w-3xl text-base leading-relaxed text-text-secondary">
          {activeEpisode.summary}
        </p>

        <div className="mb-6">
          <p className="text-section-label mb-3">Topics covered</p>
          <div className="flex flex-wrap gap-2">
            {activeEpisode.topics.map((topic) => {
              const active = highlightedTopic === topic;
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() =>
                    setHighlightedTopic((prev) => (prev === topic ? null : topic))
                  }
                  className={`rounded-full border px-3 py-1.5 text-sm transition-[background-color,border-color,color] duration-200 ${
                    active
                      ? "border-brand-charcoal bg-brand-charcoal text-text-inverse"
                      : "border-border-light bg-card text-text-secondary hover:border-border hover:text-text-primary"
                  }`}
                >
                  {topic}
                </button>
              );
            })}
          </div>
          {highlightedTopic ? (
            <p className="mt-3 animate-fade-in text-sm text-text-secondary">
              This episode covers{" "}
              <span className="font-medium text-text-primary">
                {highlightedTopic.toLowerCase()}
              </span>{" "}
              in the context of building production-ready video AI workflows
              with TwelveLabs Jockey.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border-light pt-6">
          <div className="flex flex-wrap gap-2">
            {activeEpisode.resources.map((resource) => (
              <StrandButton
                key={resource.href}
                variant="gray"
                size="small"
                href={resource.href}
                external={resource.external}
              >
                {resource.label}
              </StrandButton>
            ))}
          </div>

          {nextEpisode ? (
            <button
              type="button"
              onClick={goToNextEpisode}
              className="inline-flex items-center gap-2 text-sm font-medium text-text-primary transition-colors hover:text-accent"
            >
              Next: {nextEpisode.title}
              <StrandIcon name="arrow-box-right" className="h-4 w-4" />
            </button>
          ) : (
            <StrandButton variant="highlight" size="small" href="/arena">
              Open the Arena
              <StrandIcon name="arrow-diagonal" className="h-3.5 w-3.5" />
            </StrandButton>
          )}
        </div>
      </article>
    </section>
  );
}
