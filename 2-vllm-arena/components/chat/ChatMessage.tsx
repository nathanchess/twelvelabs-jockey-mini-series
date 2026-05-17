import type { ChatMessage as ChatMessageType } from "@/hooks/useArenaChat";
import { LogoMark } from "@/components/icons/LogoMark";
import { GoogleLogo } from "@/components/icons/GoogleLogo";
import { CompetitorMessageContent } from "@/components/chat/CompetitorMessageContent";
import { JockeyMessageContent } from "@/components/chat/JockeyMessageContent";
import { StreamingCursor } from "@/components/chat/StreamingCursor";
import type { CorpusVideo } from "@/lib/corpora";
import type { AssetIdMap } from "@/lib/asset-id-map";
import type { VideoTitleMap } from "@/lib/vref";

type ChatMessageProps = {
  message: ChatMessageType;
  side: "jockey" | "competitor";
  videoTitleMap?: VideoTitleMap;
  assetIdMap?: AssetIdMap;
  geminiSourceVideo?: CorpusVideo;
};

export function ChatMessage({
  message,
  side,
  videoTitleMap = {},
  assetIdMap = {},
  geminiSourceVideo,
}: ChatMessageProps) {
  if (message.role === "user") {
    return (
      <div className="flex shrink-0 justify-end">
        <div className="max-w-[85%] rounded-lg bg-user-bg px-4 py-2 text-sm text-user-text">
          {message.content}
        </div>
      </div>
    );
  }

  const Avatar = side === "jockey" ? LogoMark : GoogleLogo;

  return (
    <div className="flex shrink-0 gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card text-text-primary">
        <Avatar className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 text-sm leading-relaxed text-text-primary">
        {side === "jockey" ? (
          <JockeyMessageContent
            content={message.content}
            videoTitleMap={videoTitleMap}
            assetIdMap={assetIdMap}
            streaming={message.streaming}
          />
        ) : geminiSourceVideo ? (
          <CompetitorMessageContent
            content={message.content}
            sourceVideo={geminiSourceVideo}
            streaming={message.streaming}
          />
        ) : (
          <p className="whitespace-pre-wrap break-words">
            {message.content}
            {message.streaming ? <StreamingCursor /> : null}
          </p>
        )}
      </div>
    </div>
  );
}
