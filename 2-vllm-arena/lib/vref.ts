/** Maps knowledge-store / asset ids to display titles for Jockey vref tags. */
export type VideoTitleMap = Record<string, string>;

const VREF_TAG =
  /<vref\s+id="([^"]+)"(?:\s+start="([^"]*)")?(?:\s+end="([^"]*)")?\s*\/?>(?:<\/vref>)?/gi;

function formatTimestampRange(start?: string, end?: string): string {
  if (start && end) return ` (${start}–${end})`;
  if (start) return ` @ ${start}`;
  return "";
}

export function resolveTitle(id: string, map: VideoTitleMap): string {
  return (
    map[id] ??
    map[id.toLowerCase()] ??
    map[`ksi_${id}`] ??
    `Video ${id.slice(0, 8)}…`
  );
}

/** Replace Jockey `<vref>` tags with human-readable video titles. */
export function replaceVrefs(text: string, titleMap: VideoTitleMap): string {
  return text.replace(VREF_TAG, (_match, id: string, start?: string, end?: string) => {
    const title = resolveTitle(id, titleMap);
    return `${title}${formatTimestampRange(start, end)}`;
  });
}
