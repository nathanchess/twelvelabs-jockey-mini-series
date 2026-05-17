import { GoogleGenAI, createPartFromUri } from "@google/genai";
import fs from "fs";
import path from "path";

const PRELOADED_PATH = path.join(
  process.cwd(),
  "api",
  "gemini_prompt",
  "preloaded_videos.json"
);

function loadPreloadedVideos() {
  if (!fs.existsSync(PRELOADED_PATH)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(PRELOADED_PATH, "utf8")) as Array<{
    name: string;
    uri: string;
    mimeType: string;
  }>;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "Missing GEMINI_API_KEY. Run npm run preload-videos after setting your key.",
      },
      { status: 500 }
    );
  }

  const preloaded = loadPreloadedVideos();
  if (!preloaded?.length) {
    return Response.json(
      {
        error:
          "No preloaded videos found. Run npm run preload-videos to upload corpus videos to Gemini.",
      },
      { status: 500 }
    );
  }

  const { prompt } = (await request.json()) as { prompt?: string };
  if (!prompt?.trim()) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  const googleClient = new GoogleGenAI({ apiKey });

  // Gemini cannot ingest the full corpus (token limit); send one video only.
  const activeVideo = preloaded[0];
  const parts = [createPartFromUri(activeVideo.uri, activeVideo.mimeType)];
  parts.push({ text: prompt });

  let stream: AsyncIterable<{ text?: string }>;
  try {
    stream = await googleClient.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts }],
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Gemini request failed";
    return Response.json({ error: message }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const scopeHeaders = {
    "X-Gemini-Videos-Used": "1",
    "X-Gemini-Videos-Total": String(preloaded.length),
    "X-Gemini-Video-Label": activeVideo.name,
  };

  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text =
            typeof chunk.text === "string"
              ? chunk.text
              : typeof (chunk as { candidates?: unknown }).candidates !==
                  "undefined"
                ? extractGeminiChunkText(chunk)
                : "";
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Stream error";
        controller.error(new Error(message));
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...scopeHeaders,
    },
  });
}

function extractGeminiChunkText(chunk: unknown): string {
  const c = chunk as {
    text?: string;
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  if (c.text) return c.text;
  const parts = c.candidates?.[0]?.content?.parts;
  if (!parts) return "";
  return parts.map((p) => p.text ?? "").join("");
}
