import { resolveTitle, type VideoTitleMap } from "@/lib/vref";

export type ContentSegment =
  | { type: "text"; value: string }
  | { type: "asset"; assetId: string; start?: string; end?: string };

type Match = {
  index: number;
  length: number;
  assetId: string;
  start?: string;
  end?: string;
};

const VREF_TAG =
  /<vref\s+id="([^"]+)"(?:\s+start="([^"]*)")?(?:\s+end="([^"]*)")?\s*\/?>(?:<\/vref>)?/gi;

/** `here <assetId> (MM:SS–MM:SS)` or bare 24-char asset ids with optional time range. */
const ASSET_REF =
  /(?:here\s+)?([a-f0-9]{24})(?:\s*\(([0-9]{1,2}:[0-9]{2})[–-]([0-9]{1,2}:[0-9]{2})\))?/gi;

function collectMatches(text: string): Match[] {
  const matches: Match[] = [];

  for (const re of [VREF_TAG, ASSET_REF]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      matches.push({
        index: m.index,
        length: m[0].length,
        assetId: m[1],
        start: m[2] || undefined,
        end: m[3] || undefined,
      });
    }
  }

  matches.sort((a, b) => a.index - b.index || b.length - a.length);

  const merged: Match[] = [];
  let lastEnd = 0;
  for (const match of matches) {
    if (match.index < lastEnd) continue;
    merged.push(match);
    lastEnd = match.index + match.length;
  }

  return merged;
}

/** Split Jockey assistant text into plain text and asset reference segments. */
export function parseJockeyContent(text: string): ContentSegment[] {
  const matches = collectMatches(text);
  if (matches.length === 0) return [{ type: "text", value: text }];

  const segments: ContentSegment[] = [];
  let cursor = 0;

  for (const match of matches) {
    if (match.index > cursor) {
      segments.push({ type: "text", value: text.slice(cursor, match.index) });
    }
    segments.push({
      type: "asset",
      assetId: match.assetId,
      start: match.start,
      end: match.end,
    });
    cursor = match.index + match.length;
  }

  if (cursor < text.length) {
    segments.push({ type: "text", value: text.slice(cursor) });
  }

  return segments;
}

export function assetDisplayTitle(
  assetId: string,
  titleMap: VideoTitleMap
): string {
  return resolveTitle(assetId, titleMap);
}

export function parseTimeToSeconds(ts: string): number {
  const parts = ts.split(":").map((p) => Number.parseInt(p, 10));
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}
