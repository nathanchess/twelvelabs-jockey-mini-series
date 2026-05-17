/** Incremental SSE text only — ignores lifecycle events that repeat full output. */
export function extractSseDelta(json: Record<string, unknown>): string {
  const type = json.type;

  if (type === "response.output_text.delta" && typeof json.delta === "string") {
    return json.delta;
  }

  if (type === "response.content_part.delta") {
    const delta = json.delta as Record<string, unknown> | undefined;
    if (typeof delta?.text === "string") return delta.text;
  }

  return "";
}

export function extractFromJson(json: Record<string, unknown>): string {
  const sseDelta = extractSseDelta(json);
  if (sseDelta) return sseDelta;

  if (typeof json.delta === "string") return json.delta;

  const type = json.type;
  if (type === "response.output_text.delta" && typeof json.delta === "string") {
    return json.delta;
  }

  if (typeof json.text === "string") return json.text;

  const delta = json.delta as Record<string, unknown> | undefined;
  if (delta) {
    if (typeof delta.text === "string") return delta.text;
    if (typeof delta.content === "string") return delta.content;
  }

  const part = json.part as Record<string, unknown> | undefined;
  if (part && typeof part.text === "string") return part.text;

  const output = json.output as unknown;
  if (Array.isArray(output)) {
    return output
      .flatMap((item) => {
        const o = item as Record<string, unknown>;
        const content = o.content as unknown;
        if (!Array.isArray(content)) return [];
        return content.map((c) => {
          const block = c as Record<string, unknown>;
          return typeof block.text === "string" ? block.text : "";
        });
      })
      .join("");
  }

  const choices = json.choices as unknown;
  if (Array.isArray(choices)) {
    return choices
      .map((c) => {
        const choice = c as Record<string, unknown>;
        const d = choice.delta as Record<string, unknown> | undefined;
        if (typeof d?.content === "string") return d.content;
        if (typeof d?.text === "string") return d.text;
        return "";
      })
      .join("");
  }

  return "";
}

/** Pull `session_id` from TwelveLabs SSE lifecycle events. */
export function extractSessionId(
  json: Record<string, unknown>
): string | null {
  if (typeof json.session_id === "string") return json.session_id;

  const response = json.response as Record<string, unknown> | undefined;
  if (response && typeof response.session_id === "string") {
    return response.session_id;
  }

  return null;
}

function parseSseDataLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return "";

  const payload = trimmed.slice(5).trim();
  if (!payload || payload === "[DONE]") return "";

  try {
    return extractSseDelta(JSON.parse(payload) as Record<string, unknown>);
  } catch {
    return "";
  }
}

/** Collapse exact repeated copies (e.g. SSE replayed full text 3×). */
export function collapseRepeatedOutput(text: string): string {
  const trimmed = text.trimEnd();
  if (!trimmed) return text;

  for (let copies = 2; copies <= 5; copies++) {
    if (trimmed.length % copies !== 0) continue;
    const unit = trimmed.slice(0, trimmed.length / copies);
    if (unit.repeat(copies) === trimmed) return unit;
  }

  return text;
}

/** Consume a fetch Response body as SSE or plain text, invoking onDelta per text chunk. */
export async function consumeResponseStream(
  response: Response,
  onDelta: (text: string) => void,
  onProgress?: (outputChars: number) => void,
  onSseEvent?: (json: Record<string, unknown>) => void
): Promise<number> {
  const reader = response.body?.getReader();
  if (!reader) return 0;

  const contentType = response.headers.get("content-type") ?? "";
  const isEventStream = contentType.includes("text/event-stream");

  const decoder = new TextDecoder();
  let buffer = "";
  let totalChars = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });

    if (!isEventStream) {
      if (chunk) {
        onDelta(chunk);
        totalChars += chunk.length;
        onProgress?.(totalChars);
      }
      continue;
    }

    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data:")) {
        const payload = trimmed.slice(5).trim();
        if (payload && payload !== "[DONE]") {
          try {
            onSseEvent?.(JSON.parse(payload) as Record<string, unknown>);
          } catch {
            /* ignore malformed JSON */
          }
        }
      }

      const delta = parseSseDataLine(line);
      if (!delta) continue;
      onDelta(delta);
      totalChars += delta.length;
      onProgress?.(totalChars);
    }
  }

  if (isEventStream) {
    if (buffer.trim()) {
      const tail = parseSseDataLine(buffer);
      if (tail) {
        onDelta(tail);
        totalChars += tail.length;
        onProgress?.(totalChars);
      }
    }
  } else if (buffer) {
    onDelta(buffer);
    totalChars += buffer.length;
    onProgress?.(totalChars);
  }

  return totalChars;
}

/** @deprecated Use consumeResponseStream */
export function extractTextDelta(chunk: string): string {
  return chunk
    .split("\n")
    .map(parseSseDataLine)
    .join("");
}
