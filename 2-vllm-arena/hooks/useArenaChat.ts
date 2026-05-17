"use client";

import { useCallback, useRef, useState } from "react";
import {
  collapseRepeatedOutput,
  consumeResponseStream,
  extractSessionId,
} from "@/lib/stream";
import { estimateTokens } from "@/lib/pricing";
import {
  type CompetitorVideoScope,
  parseCompetitorError,
} from "@/lib/gemini-scope";
import {
  getJockeySessionId,
  setJockeySessionId,
} from "@/lib/jockey-session";

export type { CompetitorVideoScope };

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
};

export type SideMetrics = {
  ttftMs: number | null;
  totalMs: number | null;
  outputTokens: number;
  tokensPerSecond: number | null;
  error: string | null;
  status: "idle" | "streaming" | "done" | "error";
};

const emptyMetrics = (): SideMetrics => ({
  ttftMs: null,
  totalMs: null,
  outputTokens: 0,
  tokensPerSecond: null,
  error: null,
  status: "idle",
});

export function useArenaChat() {
  const [jockeyMessages, setJockeyMessages] = useState<ChatMessage[]>([]);
  const [competitorMessages, setCompetitorMessages] = useState<ChatMessage[]>(
    []
  );
  const [jockeyMetrics, setJockeyMetrics] = useState<SideMetrics>(emptyMetrics);
  const [competitorMetrics, setCompetitorMetrics] =
    useState<SideMetrics>(emptyMetrics);
  const [isRunning, setIsRunning] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);
  const [competitorVideoScope, setCompetitorVideoScope] =
    useState<CompetitorVideoScope | null>(null);
  const isRunningRef = useRef(false);

  const runJockey = useCallback(
    async (prompt: string) => {
      const assistantId = crypto.randomUUID();
      const startedAt = performance.now();
      let firstTokenAt: number | null = null;
      let outputChars = 0;

      const pushLiveMetrics = () => {
        const now = performance.now();
        const elapsed = now - startedAt;
        const outputTokens = estimateTokens(outputChars);
        setJockeyMetrics({
          ttftMs:
            firstTokenAt !== null ? firstTokenAt - startedAt : null,
          totalMs: elapsed,
          outputTokens,
          tokensPerSecond:
            elapsed > 0 ? outputTokens / (elapsed / 1000) : null,
          error: null,
          status: "streaming",
        });
      };

      setJockeyMetrics({ ...emptyMetrics(), status: "streaming" });
      setJockeyMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          streaming: true,
        },
      ]);

      try {
        const sessionId = getJockeySessionId();
        const response = await fetch("/api/jockey_prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, sessionId }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          let message = errBody || `Request failed (${response.status})`;
          try {
            const parsed = JSON.parse(errBody) as { error?: string };
            if (parsed.error) message = parsed.error;
          } catch {
            /* plain text */
          }
          throw new Error(message);
        }

        const append = (text: string) => {
          if (!text) return;
          if (firstTokenAt === null) firstTokenAt = performance.now();
          outputChars += text.length;
          setJockeyMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + text }
                : m
            )
          );
        };

        await consumeResponseStream(
          response,
          append,
          () => pushLiveMetrics(),
          (json) => {
            const sid = extractSessionId(json);
            if (sid) setJockeySessionId(sid);
          }
        );

        const completedAt = performance.now();
        const totalMs = completedAt - startedAt;
        const ttftMs =
          firstTokenAt !== null ? firstTokenAt - startedAt : null;
        const outputTokens = estimateTokens(outputChars);
        const tokensPerSecond =
          totalMs > 0 ? outputTokens / (totalMs / 1000) : null;

        setJockeyMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: collapseRepeatedOutput(m.content),
                  streaming: false,
                }
              : m
          )
        );
        setJockeyMetrics({
          ttftMs,
          totalMs,
          outputTokens,
          tokensPerSecond,
          error: null,
          status: "done",
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setJockeyMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: message, streaming: false }
              : m
          )
        );
        setJockeyMetrics({
          ...emptyMetrics(),
          error: message,
          status: "error",
          totalMs: performance.now() - startedAt,
        });
      }
    },
    []
  );

  const runCompetitor = useCallback(
    async (endpoint: string, prompt: string) => {
      const assistantId = crypto.randomUUID();
      const startedAt = performance.now();
      let firstTokenAt: number | null = null;
      let outputChars = 0;

      const pushLiveMetrics = () => {
        const now = performance.now();
        const elapsed = now - startedAt;
        const outputTokens = estimateTokens(outputChars);
        setCompetitorMetrics({
          ttftMs:
            firstTokenAt !== null ? firstTokenAt - startedAt : null,
          totalMs: elapsed,
          outputTokens,
          tokensPerSecond:
            elapsed > 0 ? outputTokens / (elapsed / 1000) : null,
          error: null,
          status: "streaming",
        });
      };

      setCompetitorMetrics({ ...emptyMetrics(), status: "streaming" });
      setCompetitorMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          streaming: true,
        },
      ]);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          let message = errBody || `Request failed (${response.status})`;
          try {
            const parsed = JSON.parse(errBody) as { error?: string };
            if (parsed.error) message = parsed.error;
          } catch {
            /* plain text */
          }
          throw new Error(parseCompetitorError(message));
        }

        const videosUsed = Number(
          response.headers.get("X-Gemini-Videos-Used") ?? 1
        );
        const videosTotal = Number(
          response.headers.get("X-Gemini-Videos-Total") ?? 1
        );
        const videoLabel =
          response.headers.get("X-Gemini-Video-Label") ?? undefined;
        setCompetitorVideoScope({
          videosUsed,
          videosTotal,
          videoLabel: videoLabel || undefined,
        });

        const append = (text: string) => {
          if (!text) return;
          if (firstTokenAt === null) firstTokenAt = performance.now();
          outputChars += text.length;
          setCompetitorMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + text }
                : m
            )
          );
        };

        await consumeResponseStream(response, append, () => {
          pushLiveMetrics();
        });

        const completedAt = performance.now();
        const totalMs = completedAt - startedAt;
        const ttftMs =
          firstTokenAt !== null ? firstTokenAt - startedAt : null;
        const outputTokens = estimateTokens(outputChars);
        const tokensPerSecond =
          totalMs > 0 ? outputTokens / (totalMs / 1000) : null;

        setCompetitorMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, streaming: false } : m
          )
        );
        setCompetitorMetrics({
          ttftMs,
          totalMs,
          outputTokens,
          tokensPerSecond,
          error: null,
          status: "done",
        });
      } catch (e) {
        const raw = e instanceof Error ? e.message : "Unknown error";
        const message = parseCompetitorError(raw);
        setCompetitorMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: message, streaming: false }
              : m
          )
        );
        setCompetitorMetrics({
          ...emptyMetrics(),
          error: message,
          status: "error",
          totalMs: performance.now() - startedAt,
        });
      }
    },
    []
  );

  const sendPrompt = useCallback(
    async (prompt: string, competitorEndpoint: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || isRunningRef.current) return;

      isRunningRef.current = true;
      setHasPrompted(true);
      setIsRunning(true);

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      };
      setJockeyMessages((prev) => [...prev, userMsg]);
      setCompetitorMessages((prev) => [...prev, userMsg]);

      await Promise.all([
        runJockey(trimmed),
        runCompetitor(competitorEndpoint, trimmed),
      ]);

      isRunningRef.current = false;
      setIsRunning(false);
    },
    [runJockey, runCompetitor]
  );

  return {
    jockeyMessages,
    competitorMessages,
    jockeyMetrics,
    competitorMetrics,
    isRunning,
    hasPrompted,
    competitorVideoScope,
    sendPrompt,
  };
}
