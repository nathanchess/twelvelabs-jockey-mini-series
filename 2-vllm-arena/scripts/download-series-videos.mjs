import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import youtubedl from "youtube-dl-exec";

const EPISODES = [
  { file: "episode-1.mp4", videoId: "ve5vVFJixLI" },
  { file: "episode-2.mp4", videoId: "ifCxoLyCVbg" },
];

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(rootDir, "../public/series");

await mkdir(outDir, { recursive: true });

for (const episode of EPISODES) {
  const output = path.join(outDir, episode.file);
  console.log(`Downloading ${episode.file}…`);

  await youtubedl(`https://www.youtube.com/watch?v=${episode.videoId}`, {
    output,
    format: "mp4[height<=720]/best[ext=mp4]/best",
    noPlaylist: true,
    forceOverwrites: true,
  });

  console.log(`Saved ${output}`);
}

console.log("Series videos ready in public/series/");
