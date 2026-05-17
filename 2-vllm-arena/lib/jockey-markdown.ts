import type { ContentSegment } from "@/lib/jockey-content";

export type MarkedAssetRef = {
  assetId: string;
  start?: string;
  end?: string;
};

export type MdListItem = {
  content: string;
  children: MdListItem[];
};

export type MdBlock =
  | { type: "paragraph"; content: string }
  | { type: "list"; items: MdListItem[] };

/** Embed asset segments as private-use placeholders for markdown parsing. */
export function segmentsToMarkedText(segments: ContentSegment[]): {
  text: string;
  assetRefs: MarkedAssetRef[];
} {
  let text = "";
  const assetRefs: MarkedAssetRef[] = [];

  for (const segment of segments) {
    if (segment.type === "text") {
      text += segment.value;
      continue;
    }
    assetRefs.push({
      assetId: segment.assetId,
      start: segment.start,
      end: segment.end,
    });
    text += `\uE000${assetRefs.length - 1}\uE001`;
  }

  return { text, assetRefs };
}

function buildNestedList(
  flat: { indent: number; content: string }[]
): MdListItem[] {
  const root: MdListItem[] = [];
  const stack: { indent: number; items: MdListItem[] }[] = [
    { indent: -1, items: root },
  ];

  for (const item of flat) {
    while (stack.length > 1 && item.indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    const node: MdListItem = { content: item.content, children: [] };
    stack[stack.length - 1].items.push(node);
    stack.push({ indent: item.indent, items: node.children });
  }

  return root;
}

/** Parse lightweight markdown blocks (paragraphs + nested lists). */
export function parseMarkdownBlocks(text: string): MdBlock[] {
  const lines = text.split("\n");
  const blocks: MdBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    const listMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
    if (listMatch) {
      const flat: { indent: number; content: string }[] = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)[-*]\s+(.*)$/);
        if (!m) break;
        flat.push({ indent: m[1].length, content: m[2] });
        i++;
      }
      blocks.push({ type: "list", items: buildNestedList(flat) });
      continue;
    }

    const paraLines: string[] = [line];
    i++;
    while (i < lines.length) {
      if (lines[i].trim() === "") break;
      if (/^\s*[-*]\s+/.test(lines[i])) break;
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: "paragraph", content: paraLines.join("\n") });
  }

  return blocks;
}

export function parseJockeyMarkdown(segments: ContentSegment[]): {
  blocks: MdBlock[];
  assetRefs: MarkedAssetRef[];
} {
  const { text, assetRefs } = segmentsToMarkedText(segments);
  return { blocks: parseMarkdownBlocks(text), assetRefs };
}

/** Split inline string into plain text, markdown spans, and asset placeholders. */
export type InlineToken =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "code"; value: string }
  | { type: "asset"; index: number };

const INLINE_PATTERN =
  /(\uE000\d+\uE001|\*\*[^*\n]+\*\*|\*[^*\n]+\*|__[^_\n]+__|_[^_\n]+_|`[^`\n]+`)/g;

export function tokenizeInline(content: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  INLINE_PATTERN.lastIndex = 0;
  while ((match = INLINE_PATTERN.exec(content)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }

    const part = match[0];
    const assetMatch = part.match(/^\uE000(\d+)\uE001$/);
    if (assetMatch) {
      tokens.push({ type: "asset", index: Number(assetMatch[1]) });
    } else if (part.startsWith("**") && part.endsWith("**")) {
      tokens.push({ type: "bold", value: part.slice(2, -2) });
    } else if (part.startsWith("__") && part.endsWith("__")) {
      tokens.push({ type: "bold", value: part.slice(2, -2) });
    } else if (part.startsWith("*") && part.endsWith("*")) {
      tokens.push({ type: "italic", value: part.slice(1, -1) });
    } else if (part.startsWith("_") && part.endsWith("_")) {
      tokens.push({ type: "italic", value: part.slice(1, -1) });
    } else if (part.startsWith("`") && part.endsWith("`")) {
      tokens.push({ type: "code", value: part.slice(1, -1) });
    } else {
      tokens.push({ type: "text", value: part });
    }

    lastIndex = match.index + part.length;
  }

  if (lastIndex < content.length) {
    tokens.push({ type: "text", value: content.slice(lastIndex) });
  }

  return tokens;
}
