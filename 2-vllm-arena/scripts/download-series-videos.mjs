import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const EPISODES = [
  { file: "episode-1.mp4", videoId: "ve5vVFJixLI" },
  { file: "episode-2.mp4", videoId: "ifCxoLyCVbg" },
];

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(rootDir, "../public/series");

async function downloadEpisode(videoId, outputPath) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    await execFileAsync(
      "yt-dlp",
      [
        "-f",
        "mp4[height<=720]/best[ext=mp4]/best",
        "-o",
        outputPath,
        "--no-playlist",
        "--force-overwrites",
        url,
      ],
      { stdio: "inherit" }
    );
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? error.code
        : undefined;

    if (code === "ENOENT") {
      throw new Error(
        "yt-dlp is not installed. Install it from https://github.com/yt-dlp/yt-dlp#installation and run this script again."
      );
    }

    throw error;
  }
}

await mkdir(outDir, { recursive: true });

for (const episode of EPISODES) {
  const output = path.join(outDir, episode.file);
  console.log(`Downloading ${episode.file}…`);
  await downloadEpisode(episode.videoId, output);
  console.log(`Saved ${output}`);
}

console.log("Series videos ready in public/series/");
