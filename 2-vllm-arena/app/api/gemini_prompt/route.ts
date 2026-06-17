import { GoogleGenAI, createPartFromUri } from "@google/genai";
import {
  ensureDefaultGeminiCorpusVideo,
  ensureGeminiFile,
  isGeminiFileExpiredError,
  type GeminiCachedFile,
} from "@/lib/gemini-files";

async function streamGeminiResponse(
  client: GoogleGenAI,
  activeVideo: GeminiCachedFile,
  prompt: string
) {
  const parts = [createPartFromUri(activeVideo.uri, activeVideo.mimeType)];
  parts.push({ text: prompt });

  return client.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts }],
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "Missing GEMINI_API_KEY. Add your Google AI Studio key to .env.",
      },
      { status: 500 }
    );
  }

  const { prompt } = (await request.json()) as { prompt?: string };
  if (!prompt?.trim()) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  const googleClient = new GoogleGenAI({ apiKey });

  let activeVideo: GeminiCachedFile;
  let totalVideos = 1;

  try {
    const resolved = await ensureDefaultGeminiCorpusVideo(googleClient);
    activeVideo = resolved.active;
    totalVideos = resolved.total;
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not prepare Gemini video upload.";
    return Response.json({ error: message }, { status: 500 });
  }

  let stream: AsyncIterable<{ text?: string }>;
  try {
    stream = await streamGeminiResponse(googleClient, activeVideo, prompt);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Gemini request failed";

    if (isGeminiFileExpiredError(message)) {
      try {
        activeVideo = await ensureGeminiFile(googleClient, activeVideo.localPath, {
          force: true,
        });
        stream = await streamGeminiResponse(googleClient, activeVideo, prompt);
      } catch (retryError) {
        const retryMessage =
          retryError instanceof Error
            ? retryError.message
            : "Gemini request failed after re-upload.";
        return Response.json({ error: retryMessage }, { status: 502 });
      }
    } else {
      return Response.json({ error: message }, { status: 502 });
    }
  }

  const encoder = new TextEncoder();
  const scopeHeaders = {
    "X-Gemini-Videos-Used": "1",
    "X-Gemini-Videos-Total": String(totalVideos),
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
