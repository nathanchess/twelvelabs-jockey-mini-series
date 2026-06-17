export type CompetitorVideoScope = {
  videosUsed: number;
  videosTotal: number;
  videoLabel?: string;
};

export function formatGeminiScopeNote(scope: CompetitorVideoScope): string {
  const file = scope.videoLabel ? ` (“${scope.videoLabel}”)` : "";
  if (scope.videosTotal <= 1) {
    return `Gemini analyzes 1 video${file}. Jockey searches the full knowledge store.`;
  }
  return `Only ${scope.videosUsed} of ${scope.videosTotal} corpus videos sent to Gemini${file} — models like Gemini hit input token limits on large video collections. Jockey searches the entire knowledge store.`;
}

export function parseCompetitorError(raw: string): string {
  const lower = raw.toLowerCase();
  if (
    lower.includes("expired") ||
    lower.includes("no longer available") ||
    (lower.includes("file") && lower.includes("not found"))
  ) {
    return "Gemini's uploaded video file expired. The arena will re-upload automatically on the next prompt — try sending your question again.";
  }
  if (
    lower.includes("token count exceeds") ||
    lower.includes("1048576") ||
    lower.includes("maximum number of tokens")
  ) {
    return "Gemini could not process the full video corpus (input token limit). This arena sends only 1 video to Gemini; Jockey still searches the full knowledge store.";
  }

  try {
    const parsed = JSON.parse(raw) as {
      error?: string | { message?: string };
    };
    const nested =
      typeof parsed.error === "string"
        ? parsed.error
        : parsed.error?.message;
    if (nested) return parseCompetitorError(nested);
  } catch {
    /* not JSON */
  }

  try {
    const inner = JSON.parse(raw) as { message?: string };
    if (inner.message) return parseCompetitorError(inner.message);
  } catch {
    /* plain text */
  }

  return raw;
}
