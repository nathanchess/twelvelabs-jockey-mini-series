import { corpora, defaultCorpusId, type CorpusVideo } from "@/lib/corpora";
import { type AssetIdMap, isRawAssetId } from "@/lib/asset-id-map";

/** Basename from a corpus `src` (e.g. `/videos/foo.mp4` → `foo.mp4`). */
export function corpusVideoFilename(video: CorpusVideo): string {
  return decodeURIComponent(video.src.split("/").pop() ?? "");
}

/** Resolve a corpus clip to a TwelveLabs asset id when the knowledge store is linked. */
export function lookupCorpusPlaybackAssetId(
  video: CorpusVideo,
  assetIdMap: AssetIdMap
): string | undefined {
  const filename = corpusVideoFilename(video);
  const candidates = [
    filename,
    filename.toLowerCase(),
    video.id,
    video.id.toLowerCase(),
  ];

  for (const key of candidates) {
    const mapped = assetIdMap[key];
    if (mapped && isRawAssetId(mapped)) return mapped;
  }

  return undefined;
}

/** Match a preload filename (e.g. `videoplayback.mp4`) to a corpus entry. */
export function findCorpusVideoByFilename(
  filename: string
): CorpusVideo | undefined {
  const corpus = corpora[defaultCorpusId];
  if (!corpus) return undefined;

  const normalized = filename.trim().toLowerCase();
  const base = normalized.replace(/\.[^.]+$/, "");

  return corpus.videos.find((video) => {
    const file = decodeURIComponent(
      video.src.split("/").pop() ?? ""
    ).toLowerCase();
    const fileBase = file.replace(/\.[^.]+$/, "");
    return (
      file === normalized ||
      fileBase === base ||
      video.id.toLowerCase() === base ||
      video.id.toLowerCase() === normalized
    );
  });
}

export function defaultGeminiCorpusVideo(): CorpusVideo | undefined {
  return corpora[defaultCorpusId]?.videos[0];
}
