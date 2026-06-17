"use client";

import { CustomVideoPlayer } from "@/components/video/CustomVideoPlayer";
import {
  youtubeThumbnailUrl,
  type SeriesEpisode,
} from "@/lib/series-episodes";

type SeriesEpisodePlayerProps = {
  episode: SeriesEpisode;
  onStarted?: () => void;
  onEnded?: () => void;
};

export function SeriesEpisodePlayer({
  episode,
  onStarted,
  onEnded,
}: SeriesEpisodePlayerProps) {
  return (
    <CustomVideoPlayer
      key={episode.id}
      src={episode.videoSrc}
      poster={youtubeThumbnailUrl(episode.youtubeId)}
      title={episode.title}
      episodeLabel={`Episode ${episode.number}`}
      onPlayStart={onStarted}
      onEnded={onEnded}
    />
  );
}
