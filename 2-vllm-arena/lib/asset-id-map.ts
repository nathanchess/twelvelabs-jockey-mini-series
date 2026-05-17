/** Maps vref / knowledge-store ids to TwelveLabs `asset_id` for playback. */
export type AssetIdMap = Record<string, string>;

const RAW_ASSET_ID = /^[a-f0-9]{24}$/i;

/** True when `id` is already a TwelveLabs asset id (24-char hex). */
export function isRawAssetId(id: string): boolean {
  return RAW_ASSET_ID.test(id);
}

/** Resolve a Jockey reference id to the asset id used by GET /v1.3/assets/:id. */
export function resolvePlaybackAssetId(
  refId: string,
  assetIdMap: AssetIdMap
): string {
  if (isRawAssetId(refId)) return refId;

  const candidates = [
    refId,
    refId.toLowerCase(),
    `ksi_${refId}`,
    `ksi_${refId.toLowerCase()}`,
  ];

  for (const key of candidates) {
    const mapped = assetIdMap[key];
    if (mapped && isRawAssetId(mapped)) return mapped;
  }

  return refId;
}
