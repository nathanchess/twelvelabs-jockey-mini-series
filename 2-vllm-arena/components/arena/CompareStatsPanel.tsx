"use client";

import { useEffect, useState } from "react";
import type { SideMetrics } from "@/hooks/useArenaChat";
import { StrandIcon } from "@/components/strand/StrandIcon";
import { estimateCost, formatMs, formatUsd } from "@/lib/pricing";

type CompareStatsPanelProps = {
  jockey: SideMetrics;
  competitor: SideMetrics;
  competitorLabel: string;
  hasPrompted: boolean;
  /** Corpus size Jockey searched (metrics shown per video). */
  jockeyVideoCount: number;
};

type StatRow = {
  label: string;
  icon: string;
  jockeyValue: string;
  competitorValue: string;
  jockeyWin: boolean;
  competitorWin: boolean;
};

function StatCell({
  value,
  highlight,
  streaming,
}: {
  value: string;
  highlight: boolean;
  streaming?: boolean;
}) {
  return (
    <td
      className={`py-2 text-sm font-mono ${
        highlight
          ? "rounded-md bg-accent-light px-2 text-text-primary"
          : "text-text-secondary"
      } ${streaming ? "animate-pulse" : ""}`}
    >
      {value}
    </td>
  );
}

function formatMetric(
  ms: number | null,
  status: SideMetrics["status"]
): string {
  if (ms === null) return status === "streaming" ? "…" : "—";
  return formatMs(ms);
}

function perVideo(value: number, videoCount: number): number {
  return videoCount > 0 ? value / videoCount : value;
}

function formatPerVideoMs(
  ms: number | null,
  videoCount: number,
  status: SideMetrics["status"]
): string {
  if (ms === null) return status === "streaming" ? "…" : "—";
  const adjusted = perVideo(ms, videoCount);
  return `${formatMs(adjusted)}`;
}

export function CompareStatsPanel({
  jockey,
  competitor,
  competitorLabel,
  hasPrompted,
  jockeyVideoCount,
}: CompareStatsPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [didAutoExpand, setDidAutoExpand] = useState(false);

  const isLive =
    jockey.status === "streaming" || competitor.status === "streaming";

  useEffect(() => {
    if (hasPrompted && !didAutoExpand) {
      setExpanded(true);
      setDidAutoExpand(true);
    }
  }, [hasPrompted, didAutoExpand]);

  if (!hasPrompted) return null;

  const videos = Math.max(jockeyVideoCount, 1);
  const jockeyCost = estimateCost("jockey", jockey.outputTokens);
  const competitorCost = estimateCost("gemini", competitor.outputTokens);
  const jockeyCostPerVideo = perVideo(jockeyCost, videos);
  const jockeyTokensPerVideo = perVideo(jockey.outputTokens, videos);
  const jockeyTpsPerVideo =
    jockey.tokensPerSecond !== null
      ? perVideo(jockey.tokensPerSecond, videos)
      : null;

  const jockeyTtftPerVideo =
    jockey.ttftMs !== null ? perVideo(jockey.ttftMs, videos) : null;
  const jockeyTotalPerVideo =
    jockey.totalMs !== null ? perVideo(jockey.totalMs, videos) : null;

  const rows: StatRow[] = [
    {
      label: "Time to first token",
      icon: "hourglass",
      jockeyValue: formatPerVideoMs(jockey.ttftMs, videos, jockey.status),
      competitorValue: formatMetric(competitor.ttftMs, competitor.status),
      jockeyWin:
        jockeyTtftPerVideo !== null &&
        competitor.ttftMs !== null &&
        jockeyTtftPerVideo < competitor.ttftMs,
      competitorWin:
        jockeyTtftPerVideo !== null &&
        competitor.ttftMs !== null &&
        competitor.ttftMs < jockeyTtftPerVideo,
    },
    {
      label: "Total inference time",
      icon: "rate-limit",
      jockeyValue: formatPerVideoMs(jockey.totalMs, videos, jockey.status),
      competitorValue: formatMetric(competitor.totalMs, competitor.status),
      jockeyWin:
        jockeyTotalPerVideo !== null &&
        competitor.totalMs !== null &&
        jockey.status === "done" &&
        competitor.status === "done" &&
        jockeyTotalPerVideo < competitor.totalMs,
      competitorWin:
        jockeyTotalPerVideo !== null &&
        competitor.totalMs !== null &&
        jockey.status === "done" &&
        competitor.status === "done" &&
        competitor.totalMs < jockeyTotalPerVideo,
    },
    {
      label: "Est. output tokens",
      icon: "usage",
      jockeyValue:
        jockey.outputTokens > 0
          ? String(Math.round(jockeyTokensPerVideo))
          : jockey.status === "streaming"
            ? "…"
            : "0",
      competitorValue:
        competitor.outputTokens > 0
          ? String(competitor.outputTokens)
          : competitor.status === "streaming"
            ? "…"
            : "0",
      jockeyWin: false,
      competitorWin: false,
    },
    {
      label: "Est. cost",
      icon: "billings",
      jockeyValue:
        jockey.outputTokens > 0
          ? formatUsd(jockeyCostPerVideo)
          : jockey.status === "streaming"
            ? "…"
            : formatUsd(0),
      competitorValue:
        competitor.outputTokens > 0
          ? formatUsd(competitorCost)
          : competitor.status === "streaming"
            ? "…"
            : formatUsd(0),
      jockeyWin:
        jockey.status === "done" &&
        competitor.status === "done" &&
        jockeyCostPerVideo < competitorCost,
      competitorWin:
        jockey.status === "done" &&
        competitor.status === "done" &&
        competitorCost < jockeyCostPerVideo,
    },
    {
      label: "Throughput",
      icon: "rate-limit",
      jockeyValue:
        jockeyTpsPerVideo !== null
          ? `${jockeyTpsPerVideo.toFixed(1)} tok/s`
          : jockey.status === "streaming"
            ? "…"
            : "—",
      competitorValue:
        competitor.tokensPerSecond !== null
          ? `${competitor.tokensPerSecond.toFixed(1)} tok/s`
          : competitor.status === "streaming"
            ? "…"
            : "—",
      jockeyWin:
        jockeyTpsPerVideo !== null &&
        competitor.tokensPerSecond !== null &&
        jockey.status === "done" &&
        competitor.status === "done" &&
        jockeyTpsPerVideo > competitor.tokensPerSecond,
      competitorWin:
        jockeyTpsPerVideo !== null &&
        competitor.tokensPerSecond !== null &&
        jockey.status === "done" &&
        competitor.status === "done" &&
        competitor.tokensPerSecond > jockeyTpsPerVideo,
    },
  ];

  return (
    <section className="shrink-0 border-t border-border-light bg-surface">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-3 text-left transition-colors hover:bg-card/60"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2 text-[15px] text-header">
          Comparison metrics
          {isLive && (
            <span className="text-xs font-normal text-text-tertiary">
              Updating…
            </span>
          )}
        </span>
        <StrandIcon
          name="arrow-box-down"
          className={`h-4 w-4 text-text-secondary transition-transform duration-300 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="animate-fade-in border-t border-border-light px-6 pb-6 pt-2">
            <p className="mb-4 text-sm text-text-secondary">
              Token and cost figures are estimates for illustration only. Jockey
              values are per video (÷{videos} videos analyzed); Gemini values
              are for 1 video.
            </p>
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-sm uppercase tracking-wide text-text-secondary">
                  <th className="pb-3 font-semibold">Metric</th>
                  <th className="pb-3 font-semibold">
                    Jockey
                    <span className="mt-0.5 block text-xs font-normal normal-case tracking-normal text-text-tertiary">
                      per video (÷{videos})
                    </span>
                  </th>
                  <th className="pb-3 font-semibold">{competitorLabel}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-t border-border-light">
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-text-primary">
                        <StrandIcon name={row.icon} className="h-4 w-4" />
                        {row.label}
                      </span>
                    </td>
                    <StatCell
                      value={row.jockeyValue}
                      highlight={row.jockeyWin}
                      streaming={jockey.status === "streaming"}
                    />
                    <StatCell
                      value={row.competitorValue}
                      highlight={row.competitorWin}
                      streaming={competitor.status === "streaming"}
                    />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
