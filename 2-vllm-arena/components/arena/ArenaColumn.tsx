"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/hooks/useArenaChat";
import { ChatMessage as ChatMessageView } from "@/components/chat/ChatMessage";
import { MinimalSelect } from "@/components/strand/MinimalSelect";
import type { SelectOption } from "@/components/strand/MinimalSelect";
import { LogoMark } from "@/components/icons/LogoMark";
import { GoogleLogo } from "@/components/icons/GoogleLogo";
import type { AssetIdMap } from "@/lib/asset-id-map";
import type { CorpusVideo } from "@/lib/corpora";
import type { VideoTitleMap } from "@/lib/vref";

type ArenaColumnProps = {
  side: "jockey" | "competitor";
  title: string;
  messages: ChatMessage[];
  videoTitleMap?: VideoTitleMap;
  assetIdMap?: AssetIdMap;
  geminiSourceVideo?: CorpusVideo;
  scopeNote?: string;
  modelSelect?: {
    options: SelectOption[];
    value: string;
    onChange: (id: string) => void;
  };
};

const HEADER_SELECT_WIDTH = "w-[200px]";

export function ArenaColumn({
  side,
  title,
  messages,
  videoTitleMap,
  assetIdMap,
  geminiSourceVideo,
  scopeNote,
  modelSelect,
}: ArenaColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const HeaderIcon = side === "jockey" ? LogoMark : GoogleLogo;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-[56px] shrink-0 items-center border-b border-border px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center">
            <HeaderIcon className="h-5 w-5" aria-hidden />
          </span>
          <span className="truncate text-[15px] font-medium leading-none text-text-primary">
            {title}
          </span>
        </div>
        <div
          className={`flex shrink-0 items-center justify-end ${HEADER_SELECT_WIDTH}`}
        >
          {modelSelect ? (
            <MinimalSelect
              options={modelSelect.options}
              value={modelSelect.value}
              onChange={modelSelect.onChange}
              align="right"
              className="w-full"
            />
          ) : (
            <span className="sr-only">Model selector spacer</span>
          )}
        </div>
      </header>

      {scopeNote ? (
        <div className="shrink-0 border-b border-border bg-card px-4 py-2.5">
          <p className="text-xs leading-relaxed text-text-tertiary">
            {scopeNote}
          </p>
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-text-tertiary">
            Send a prompt to compare responses.
          </p>
        ) : (
          messages.map((m) => (
            <ChatMessageView
              key={`${side}-${m.id}`}
              message={m}
              side={side}
              videoTitleMap={side === "jockey" ? videoTitleMap : undefined}
              assetIdMap={side === "jockey" ? assetIdMap : undefined}
              geminiSourceVideo={
                side === "competitor" ? geminiSourceVideo : undefined
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
