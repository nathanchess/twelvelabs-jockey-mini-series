const HEADERS = {
  "x-api-key": process.env.TL_API_KEY ?? "",
  "Content-Type": "application/json",
};

const BASE_URL = "https://api.twelvelabs.io/v1.3";

type AssetResponse = {
  _id?: string;
  filename?: string;
  duration?: number;
  hls?: { manifest_url?: string; status?: string };
  thumbnail?: { representative_url?: string; status?: string };
  status?: string;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ assetId: string }> }
) {
  if (!process.env.TL_API_KEY) {
    return Response.json(
      { error: "Missing TL_API_KEY environment variable." },
      { status: 500 }
    );
  }

  const { assetId } = await context.params;
  if (!assetId?.trim()) {
    return Response.json({ error: "assetId is required" }, { status: 400 });
  }

  if (!/^[a-f0-9]{24}$/i.test(assetId)) {
    return Response.json(
      {
        error:
          "Invalid asset id. Expected a 24-character hex asset id from the knowledge store.",
      },
      { status: 400 }
    );
  }

  const response = await fetch(`${BASE_URL}/assets/${encodeURIComponent(assetId)}`, {
    headers: HEADERS,
  });

  if (!response.ok) {
    const errText = await response.text();
    return Response.json(
      { error: errText || `TwelveLabs API error (${response.status})` },
      { status: response.status }
    );
  }

  const asset = (await response.json()) as AssetResponse;

  return Response.json({
    id: asset._id ?? assetId,
    filename: asset.filename ?? null,
    duration: asset.duration ?? null,
    status: asset.status ?? null,
    manifestUrl: asset.hls?.manifest_url ?? null,
    hlsStatus: asset.hls?.status ?? null,
    thumbnailUrl: asset.thumbnail?.representative_url ?? null,
  });
}
