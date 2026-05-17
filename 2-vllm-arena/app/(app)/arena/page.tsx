"use client";

import { useMemo, useState } from "react";
import { ArenaColumn } from "@/components/arena/ArenaColumn";
import { CompareStatsPanel } from "@/components/arena/CompareStatsPanel";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { VideoCorpusBar } from "@/components/video/VideoCorpusBar";
import { useArenaChat } from "@/hooks/useArenaChat";
import { useVideoTitleMap } from "@/hooks/useVideoTitleMap";
import { corpora, defaultCorpusId } from "@/lib/corpora";
import {
  defaultGeminiCorpusVideo,
  findCorpusVideoByFilename,
} from "@/lib/corpus-video";
import { formatGeminiScopeNote } from "@/lib/gemini-scope";
import {
  competitorModels,
  defaultCompetitorId,
  jockeyModel,
} from "@/lib/models";

export default function ArenaPage() {
  const [competitorId, setCompetitorId] = useState(defaultCompetitorId);
  const competitor = useMemo(
    () =>
      competitorModels.find((m) => m.id === competitorId) ?? competitorModels[0],
    [competitorId]
  );

  const { titleMap, assetIdMap, videoCount: storeVideoCount } =
    useVideoTitleMap();

  const corpusVideoCount =
    storeVideoCount || corpora[defaultCorpusId]?.videos.length || 0;
  const {
    jockeyMessages,
    competitorMessages,
    jockeyMetrics,
    competitorMetrics,
    isRunning,
    hasPrompted,
    competitorVideoScope,
    sendPrompt,
  } = useArenaChat();

  const geminiScopeNote = formatGeminiScopeNote(
    competitorVideoScope ?? {
      videosUsed: 1,
      videosTotal: Math.max(corpusVideoCount, 1),
    }
  );

  const geminiSourceVideo = useMemo(() => {
    if (competitorVideoScope?.videoLabel) {
      return (
        findCorpusVideoByFilename(competitorVideoScope.videoLabel) ??
        defaultGeminiCorpusVideo()
      );
    }
    return defaultGeminiCorpusVideo();
  }, [competitorVideoScope]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0">
        <VideoCorpusBar />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-border overflow-hidden">
        <ArenaColumn
          side="jockey"
          title={jockeyModel.label}
          messages={jockeyMessages}
          videoTitleMap={titleMap}
          assetIdMap={assetIdMap}
        />
        <ArenaColumn
          side="competitor"
          title={competitor.shortLabel}
          messages={competitorMessages}
          scopeNote={geminiScopeNote}
          geminiSourceVideo={geminiSourceVideo}
          modelSelect={{
            options: competitorModels.map((m) => ({
              id: m.id,
              label: m.label,
            })),
            value: competitorId,
            onChange: setCompetitorId,
          }}
        />
      </div>

      <div className="shrink-0">
        <ChatComposer
          disabled={isRunning}
          onSend={(prompt) => sendPrompt(prompt, competitor.endpoint)}
        />
      </div>

      <CompareStatsPanel
        jockey={jockeyMetrics}
        competitor={competitorMetrics}
        competitorLabel={competitor.label}
        hasPrompted={hasPrompted}
        jockeyVideoCount={corpusVideoCount}
      />
    </div>
  );
}
