export type SeriesEpisodeLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type SeriesEpisode = {
  id: string;
  number: number;
  youtubeId: string;
  videoSrc: string;
  title: string;
  summary: string;
  topics: string[];
  cta: {
    label: string;
    href: string;
    external?: boolean;
  };
  resources: SeriesEpisodeLink[];
};

export const SERIES_EPISODES: SeriesEpisode[] = [
  {
    id: "getting-started",
    number: 1,
    youtubeId: "ve5vVFJixLI",
    videoSrc:
      process.env.NEXT_PUBLIC_SERIES_EPISODE_1_URL ?? "/series/episode-1.mp4",
    title: "Getting Started with TwelveLabs Jockey",
    summary:
      "Move from raw video files to an intelligent, queryable dataset. Learn Knowledge Store fundamentals, asset uploads, and how multimodal agents process visual and audio information—without boilerplate.",
    topics: [
      "Knowledge Stores",
      "Video asset management",
      "Cold-start onboarding",
      "Multimodal agents",
      "Upload & indexing",
    ],
    cta: {
      label: "Get your API key",
      href: "https://playground.twelvelabs.io",
      external: true,
    },
    resources: [
      {
        label: "Source code",
        href: "https://github.com/nathanchess/twelvelabs-jockey-mini-series",
        external: true,
      },
      {
        label: "Documentation",
        href: "https://docs.twelvelabs.io",
        external: true,
      },
      {
        label: "Research",
        href: "https://www.twelvelabs.io/research",
        external: true,
      },
    ],
  },
  {
    id: "jockey-vs-vllm",
    number: 2,
    youtubeId: "ifCxoLyCVbg",
    videoSrc:
      process.env.NEXT_PUBLIC_SERIES_EPISODE_2_URL ?? "/series/episode-2.mp4",
    title: "Jockey vs. Standard VLMs",
    summary:
      "Side-by-side benchmark of Jockey against generic vision LLMs. Compare inference quality, throughput, token output, and pricing—and see how much less code a purpose-built video agent requires.",
    topics: [
      "Benchmark dashboard",
      "Inference cost",
      "Throughput & tokens",
      "Temporal video understanding",
      "Code comparison",
    ],
    cta: {
      label: "Open the Arena",
      href: "/arena",
    },
    resources: [
      {
        label: "Live demo",
        href: "https://twelvelabs-jockey-mini-series.vercel.app/arena",
        external: true,
      },
      {
        label: "Source code",
        href: "https://github.com/nathanchess/twelvelabs-jockey-mini-series",
        external: true,
      },
      {
        label: "Documentation",
        href: "https://docs.twelvelabs.io",
        external: true,
      },
    ],
  },
];

export function youtubeThumbnailUrl(youtubeId: string) {
  return `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`;
}

export function youtubeWatchUrl(youtubeId: string) {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}
