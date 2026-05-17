const HEADERS = {
  "x-api-key": process.env.TL_API_KEY ?? "",
  "Content-Type": "application/json",
};

const BASE_URL = "https://api.twelvelabs.io/v1.3";

export async function POST(request: Request) {
  if (!process.env.TL_API_KEY) {
    return Response.json(
      { error: "Missing TL_API_KEY environment variable." },
      { status: 500 }
    );
  }

  if (!process.env.KNOWLEDGE_STORE_ID) {
    return Response.json(
      { error: "Missing KNOWLEDGE_STORE_ID environment variable." },
      { status: 500 }
    );
  }

  const { prompt, sessionId } = (await request.json()) as {
    prompt?: string;
    sessionId?: string | null;
  };

  if (!prompt?.trim()) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {
    model: "jockey1.0",
    stream: true,
    input: [
      {
        type: "message",
        role: "user",
        content: prompt,
      },
    ],
    knowledge_store_id: process.env.KNOWLEDGE_STORE_ID,
  };

  if (sessionId) {
    payload.session_id = sessionId;
  }

  const response = await fetch(`${BASE_URL}/responses`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    return Response.json(
      { error: errText || `TwelveLabs API error (${response.status})` },
      { status: response.status }
    );
  }

  if (!response.body) {
    return Response.json(
      { error: "No response body from TwelveLabs" },
      { status: 502 }
    );
  }

  return new Response(response.body, {
    headers: {
      "Content-Type":
        response.headers.get("content-type") ?? "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
