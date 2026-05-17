import { corpora, defaultCorpusId, type CorpusVideo } from "@/lib/corpora";

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
