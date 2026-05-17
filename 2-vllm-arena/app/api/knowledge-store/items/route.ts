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

type AssetResponse = {
  filename?: string;
};

function mapAssetIdKeys(
  assetIdMap: Record<string, string>,
  playbackAssetId: string,
  ...keys: (string | undefined)[]
) {
  for (const key of keys) {
    if (!key) continue;
    assetIdMap[key] = playbackAssetId;
    assetIdMap[key.toLowerCase()] = playbackAssetId;
  }
}

async function mapAssetFilenames(
  assetIdMap: Record<string, string>,
  assetIds: string[]
) {
  const uniqueIds = [...new Set(assetIds.filter((id) => /^[a-f0-9]{24}$/i.test(id)))];

  await Promise.all(
    uniqueIds.map(async (assetId) => {
      try {
        const response = await fetch(`${BASE_URL}/assets/${encodeURIComponent(assetId)}`, {
          headers: HEADERS,
        });
        if (!response.ok) return;

        const asset = (await response.json()) as AssetResponse;
        const filename = asset.filename?.trim();
        if (!filename) return;

        mapAssetIdKeys(assetIdMap, assetId, filename);
      } catch {
        /* filename mapping is best-effort */
      }
    })
  );
}

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
        mapAssetIdKeys(assetIdMap, playbackAssetId, key);
      }
    }

    if (playbackAssetId) {
      mapAssetIdKeys(assetIdMap, playbackAssetId, displayTitle);
    }
  }

  const playbackAssetIds = (body.data ?? [])
    .map((item) => item.asset_id)
    .filter((id): id is string => typeof id === "string");

  await mapAssetFilenames(assetIdMap, playbackAssetIds);

  return Response.json({ titleMap, assetIdMap, videoCount: body.data?.length ?? 0 });
}
