const HEADERS = {
  "x-api-key": process.env.TL_API_KEY ?? "",
  "Content-Type": "application/json",
};

const BASE_URL = "https://api.twelvelabs.io/v1.3";

type KnowledgeStoreItem = {
  _id?: string;
  id?: string;
  asset_id?: string;
  metadata?: { title?: string; name?: string };
};

export async function GET() {
  if (!process.env.TL_API_KEY) {
    return Response.json(
      { error: "Missing TL_API_KEY environment variable." },
      { status: 500 }
    );
  }

  const storeId = process.env.KNOWLEDGE_STORE_ID;
  if (!storeId) {
    return Response.json(
      { error: "Missing KNOWLEDGE_STORE_ID environment variable." },
      { status: 500 }
    );
  }

  const response = await fetch(
    `${BASE_URL}/knowledge-stores/${storeId}/items?page_size=100`,
    { headers: HEADERS }
  );

  if (!response.ok) {
    const errText = await response.text();
    return Response.json(
      { error: errText || `TwelveLabs API error (${response.status})` },
      { status: response.status }
    );
  }

  const body = (await response.json()) as {
    data?: KnowledgeStoreItem[];
  };

  const titleMap: Record<string, string> = {};
  const assetIdMap: Record<string, string> = {};

  for (const item of body.data ?? []) {
    const title =
      item.metadata?.title ??
      item.metadata?.name ??
      item.asset_id ??
      item._id ??
      item.id;
    if (!title || typeof title !== "string") continue;

    const displayTitle =
      typeof item.metadata?.title === "string"
        ? item.metadata.title
        : typeof item.metadata?.name === "string"
          ? item.metadata.name
          : String(title);

    const playbackAssetId = item.asset_id;
    const keys = new Set<string>();

    for (const key of [item._id, item.id, item.asset_id]) {
      if (key) keys.add(key);
    }

    const rawId = item._id ?? item.id;
    if (rawId?.startsWith("ksi_")) {
      keys.add(rawId.slice(4));
    }

    for (const key of keys) {
      titleMap[key] = displayTitle;
      if (playbackAssetId) {
        assetIdMap[key] = playbackAssetId;
        assetIdMap[key.toLowerCase()] = playbackAssetId;
      }
    }
  }

  return Response.json({ titleMap, assetIdMap, videoCount: body.data?.length ?? 0 });
}
